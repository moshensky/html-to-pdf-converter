import * as puppeteer from 'puppeteer'
import { calcContentSize, mkSizedPdf } from './puppeteer'
import {
  ContentWithFooter,
  PDFWithEmptySpaceForFooter,
  PDFWithEmptySpaceForFooterAndPagesCount,
  HeaderFooterType,
  PrintMargin,
  PageSize,
  PdfContent,
} from './types'
import { propagatePageNumbers } from './helpers'
import { appendPdfs, getPagesCount, mergePdfs, addFooter } from './hummus'
import { unreachable } from './utils/index'

const getFooterSize = async (
  footer: HeaderFooterType,
  margin: PrintMargin,
  pageSize: PageSize,
  page: puppeteer.Page,
) => {
  switch (footer.type) {
    case 'HtmlHeaderFooter': {
      return calcContentSize(footer.html, pageSize, margin, page)
    }
    case 'StaticHeaderFooter': {
      const { left, center, right } = footer
      const height = [left, center, right]
        .filter(x => x !== undefined)
        .map(x => {
          if (!x) {
            throw new Error('Should be impossible!')
          }

          return x.size
        })
        .reduce((a, b) => Math.max(a, b))

      return { width: pageSize.width - margin.left - margin.right, height }
    }
    default:
      return unreachable(footer)
  }
}

const mkPDFWithEmptySpaceForFooter = async (
  { pdfContent, footer, margin, pageSize }: ContentWithFooter,
  page: puppeteer.Page,
): Promise<PDFWithEmptySpaceForFooter> => {
  const footerSize = await getFooterSize(footer, margin, pageSize, page)
  const pdfBuffer = await mkSizedPdf(pdfContent, page, pageSize, {
    ...margin,
    bottom: margin.bottom + footerSize.height,
  })

  return { pdf: pdfBuffer, margin, footerSize, footer }
}

const addFooterToPdf = async (
  { pdf, margin, footerSize, footer, pagesCount }: PDFWithEmptySpaceForFooterAndPagesCount,
  page: puppeteer.Page,
  startFromPage: number,
  totalPagesCount: number,
): Promise<Buffer> => {
  switch (footer.type) {
    case 'HtmlHeaderFooter': {
      const htmlFooter = propagatePageNumbers(
        footer.html,
        startFromPage,
        startFromPage + pagesCount,
        totalPagesCount,
      )
      const footerPdf = await mkSizedPdf(htmlFooter, page, footerSize)
      return mergePdfs(pdf, footerPdf, margin)
    }
    case 'StaticHeaderFooter': {
      return addFooter({
        pdfBuffer: pdf,
        margin,
        txt: footer,
        startPageNum: startFromPage,
        endPageNum: startFromPage + pagesCount,
        totalPagesCount,
      })
    }
    default:
      return unreachable(footer)
  }
}

export interface MkPdfOptions {
  puppeteer?: puppeteer.LaunchOptions
}

export const mkCompoundPdf = async (
  contents: ContentWithFooter[],
  options: MkPdfOptions = {},
): Promise<Buffer> => {
  const browser = await puppeteer.launch(options.puppeteer)
  const page = await browser.newPage()
  const pdfsWithEmptySpaceForFooter: PDFWithEmptySpaceForFooterAndPagesCount[] = []
  for (let content of contents) {
    const pdfWithEmptySpaceForFooter = await mkPDFWithEmptySpaceForFooter(content, page)
    const pagesCount = getPagesCount(pdfWithEmptySpaceForFooter.pdf)
    pdfsWithEmptySpaceForFooter.push({ ...pdfWithEmptySpaceForFooter, pagesCount })
  }

  const totalPagesCount = pdfsWithEmptySpaceForFooter
    .map(x => x.pagesCount)
    .reduce((acc, v) => acc + v, 0)
  const pdfsWithFooter: Buffer[] = []
  let startPage = 1
  for (let content of pdfsWithEmptySpaceForFooter) {
    pdfsWithFooter.push(await addFooterToPdf(content, page, startPage, totalPagesCount))
    startPage += content.pagesCount
  }

  await browser.close()

  return appendPdfs(pdfsWithFooter)
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
