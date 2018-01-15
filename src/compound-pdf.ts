import * as puppeteer from 'puppeteer'
import { calcContentSize, mkSizedPdf } from './puppeteer'
import {
  ContentWithHeaderFooter,
  PDFWithSpaceForHeaderFooter,
  HeaderFooterType,
  PrintMargin,
  PageSize,
  PdfContent,
  HeaderFooterWithPageSize,
} from './types'
import { propagatePageNumbers } from './helpers'
import { appendPdfs, getPagesCount, mergePdfs, addFooter } from './hummus'
import { unreachable } from './utils/index'
import { Millimeters, PdfText, SlotType } from './index'

const getFooterSize = async (
  footer: HeaderFooterType,
  margin: PrintMargin,
  pageSize: PageSize,
  page: puppeteer.Page,
): Promise<PageSize> => {
  switch (footer.type) {
    case 'HtmlHeaderFooter': {
      return calcContentSize(footer.html, pageSize, margin, page)
    }
    case 'TextHeaderFooter': {
      const { left, center, right } = footer
      const height = [left, center, right]
        .filter((x: PdfText | undefined): x is PdfText => x !== undefined)
        .map(x => x.size)
        .reduce((a, b) => Millimeters.max(a, b))

      return {
        width: pageSize.width.subtract(margin.left).subtract(margin.right),
        height: height.add(Millimeters.of(4)), // add top padding to footer of 4 mm
      }
    }
    default:
      return unreachable(footer)
  }
}

const mkPDFWithSpaceForHeaderFooter = async (
  { pdfContent, header, footer, margin, pageSize }: ContentWithHeaderFooter,
  page: puppeteer.Page,
): Promise<PDFWithSpaceForHeaderFooter> => {
  const headerSize = header ? PageSize.ofZero() : PageSize.ofZero()
  const footerSize = footer
    ? await getFooterSize(footer, margin, pageSize, page)
    : PageSize.ofZero()
  const pdfBuffer = await mkSizedPdf(
    pdfContent,
    page,
    // TODO: evaluate whether this is still needed
    {
      height: pageSize.height,
      // adjust page width according to rounded footer width
      width: footerSize.width.add(margin.left).add(margin.right),
    },
    {
      ...margin,
      top: margin.top.add(headerSize.height),
      bottom: margin.bottom.add(footerSize.height),
    },
  )

  return {
    mainPdf: pdfBuffer,
    margin,
    header: header ? { size: headerSize, data: header } : undefined,
    footer: footer ? { size: footerSize, data: footer } : undefined,
  }
}

interface AddHeaderFooterToPdfArgs {
  pdf: Buffer
  margin: PrintMargin
  slot: HeaderFooterWithPageSize
  pagesCount: number
  page: puppeteer.Page
  startFromPage: number
  totalPagesCount: number
  type: SlotType
}

const addHeaderFooterToPdf = async (args: AddHeaderFooterToPdfArgs): Promise<Buffer> => {
  const { pdf, margin, slot, pagesCount, page, startFromPage, totalPagesCount, type } = args
  const { data, size } = slot
  switch (data.type) {
    case 'HtmlHeaderFooter': {
      const htmlContent = propagatePageNumbers(
        data.html,
        startFromPage,
        startFromPage + pagesCount,
        totalPagesCount,
      )
      const pdfContent = await mkSizedPdf(htmlContent, page, size)

      return mergePdfs(pdf, pdfContent, margin, type)
    }
    case 'TextHeaderFooter': {
      if (type === 'header') {
        throw new Error('TODO: to be developed!')
      }

      return addFooter({
        pdfBuffer: pdf,
        margin,
        txt: data,
        startPageNum: startFromPage,
        endPageNum: startFromPage + pagesCount,
        totalPagesCount,
      })
    }
    default:
      return unreachable(data)
  }
}

export interface MkPdfOptions {
  puppeteer?: puppeteer.LaunchOptions
}

export const mkCompoundPdf = async (
  contents: ContentWithHeaderFooter[],
  options: MkPdfOptions = {},
): Promise<Buffer> => {
  const browser = await puppeteer.launch(options.puppeteer)
  const page = await browser.newPage()
  const pdfsWithSpaceForHeaderFooter: {
    content: PDFWithSpaceForHeaderFooter
    pagesCount: number
  }[] = []
  for (let content of contents) {
    const pdfData = await mkPDFWithSpaceForHeaderFooter(content, page)
    const pagesCount = getPagesCount(pdfData.mainPdf)
    pdfsWithSpaceForHeaderFooter.push({ content: pdfData, pagesCount })
  }

  const totalPagesCount = pdfsWithSpaceForHeaderFooter
    .map(x => x.pagesCount)
    .reduce((acc, v) => acc + v, 0)
  const pdfsWithSlots: Buffer[] = []
  let startPage = 1
  for (let { content, pagesCount } of pdfsWithSpaceForHeaderFooter) {
    const { mainPdf, margin, footer, header } = content
    const commonArgs = { margin, pagesCount, page, startFromPage: startPage, totalPagesCount }

    const withHeader = header
      ? await addHeaderFooterToPdf({ ...commonArgs, pdf: mainPdf, slot: header, type: 'header' })
      : mainPdf

    const withSlots = footer
      ? await addHeaderFooterToPdf({ ...commonArgs, pdf: withHeader, slot: footer, type: 'footer' })
      : withHeader

    pdfsWithSlots.push(withSlots)
    startPage += pagesCount
  }

  await browser.close()

  return appendPdfs(pdfsWithSlots)
}

export const mkPdf = async (
  { margin, pageSize, pdfContent }: PdfContent,
  options: MkPdfOptions = {},
): Promise<Buffer> => {
  const browser = await puppeteer.launch(options.puppeteer)
  const page = await browser.newPage()
  const pdfBuffer = await mkSizedPdf(pdfContent, page, pageSize, margin)

  await browser.close()

  return pdfBuffer
}
