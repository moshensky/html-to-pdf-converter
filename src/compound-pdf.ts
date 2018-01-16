import * as puppeteer from 'puppeteer'
import { calcContentSize, mkSizedPdf } from './puppeteer'
import {
  PdfContentWithSlots,
  PdfWithSpaceForSlots,
  Slot,
  PrintMargin,
  PageSize,
  PdfContent,
  SlotWithPageSize,
} from './types'
import { propagatePageNumbers } from './helpers'
import { appendPdfs, getPagesCount, mergePdfs, addFooter } from './hummus'
import { unreachable } from './utils/index'
import { Millimeters, PdfText, SlotType } from './index'

const calcSlotSize = async (
  footer: Slot,
  margin: PrintMargin,
  pageSize: PageSize,
  page: puppeteer.Page,
): Promise<PageSize> => {
  switch (footer.type) {
    case 'HtmlSlot': {
      return calcContentSize(footer.html, pageSize, margin, page)
    }
    case 'TextSlot': {
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

const mkPdfWithSpaceForSlots = async (
  { pdfContent, header, footer, margin, pageSize }: PdfContentWithSlots,
  page: puppeteer.Page,
): Promise<PdfWithSpaceForSlots> => {
  const headerSize = header ? await calcSlotSize(header, margin, pageSize, page) : PageSize.ofZero()
  const footerSize = footer ? await calcSlotSize(footer, margin, pageSize, page) : PageSize.ofZero()
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
  slot: SlotWithPageSize
  pagesCount: number
  page: puppeteer.Page
  startFromPage: number
  totalPagesCount: number
  slotType: SlotType
}

const addSlotToPdf = async (args: AddHeaderFooterToPdfArgs): Promise<Buffer> => {
  const { pdf, margin, slot, pagesCount, page, startFromPage, totalPagesCount, slotType } = args
  const { data, size } = slot
  switch (data.type) {
    case 'HtmlSlot': {
      const htmlContent = propagatePageNumbers(
        data.html,
        startFromPage,
        startFromPage + pagesCount,
        totalPagesCount,
      )
      const pdfContent = await mkSizedPdf(htmlContent, page, size)

      return mergePdfs(pdf, pdfContent, margin, slotType)
    }
    case 'TextSlot': {
      if (slotType === 'header') {
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
  contents: PdfContentWithSlots[],
  options: MkPdfOptions = {},
): Promise<Buffer> => {
  const browser = await puppeteer.launch(options.puppeteer)
  const page = await browser.newPage()
  const pdfsWithSpaceForSlots: {
    content: PdfWithSpaceForSlots
    pagesCount: number
  }[] = []
  for (let content of contents) {
    const pdfData = await mkPdfWithSpaceForSlots(content, page)
    const pagesCount = getPagesCount(pdfData.mainPdf)
    pdfsWithSpaceForSlots.push({ content: pdfData, pagesCount })
  }

  const totalPagesCount = pdfsWithSpaceForSlots
    .map(x => x.pagesCount)
    .reduce((acc, v) => acc + v, 0)
  const pdfsWithSlots: Buffer[] = []
  let startPage = 1
  for (let { content, pagesCount } of pdfsWithSpaceForSlots) {
    const { mainPdf, margin, footer, header } = content
    const common = { margin, pagesCount, page, startFromPage: startPage, totalPagesCount }

    const withHeader = header
      ? await addSlotToPdf({ ...common, pdf: mainPdf, slot: header, slotType: 'header' })
      : mainPdf

    const withSlots = footer
      ? await addSlotToPdf({ ...common, pdf: withHeader, slot: footer, slotType: 'footer' })
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
