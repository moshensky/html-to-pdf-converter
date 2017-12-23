import { range } from 'ramda'
import {
  createReader,
  createWriterToModify,
  PDFPageModifier,
  XObjectContentContext,
  WriteTextOptions,
  createWriter,
  ePDFPageBoxMediaBox,
} from 'hummus'
import { ReadStreamForBuffer } from './read-stream-for-buffer'
import { PDFStreamForBuffer } from './pdf-stream-for-buffer'
import { PrintMargin, StaticHeaderFooter, PDF_POINTS_PER_MM, PdfPoints } from './types'

interface PageInfo {
  width: PdfPoints
  height: PdfPoints
  pageNumber: number
  pagesCount: number
}

type GetWriteTextArguments = (
  pageInfo: PageInfo,
) => [string, PdfPoints, PdfPoints, WriteTextOptions]

export interface AddFooterArgs {
  pdfBuffer: Buffer
  margin: PrintMargin
  txt: StaticHeaderFooter
  startPageNum: number
  endPageNum: number
  totalPagesCount: number
}

export const addFooter = (args: AddFooterArgs) => {
  const { pdfBuffer, margin, txt, startPageNum, endPageNum, totalPagesCount } = args
  const pdfReader = createReader(new ReadStreamForBuffer(pdfBuffer))

  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriterToModify(new ReadStreamForBuffer(pdfBuffer), outputBuffer)

  const writeTextArguments: GetWriteTextArguments[] = []

  if (txt.left) {
    const { fontPath, text, size, underline, color } = txt.left
    const font = pdfWriter.getFontForFile(fontPath)
    writeTextArguments.push(() => {
      const x = margin.left * PDF_POINTS_PER_MM
      const y = margin.bottom * PDF_POINTS_PER_MM
      return [text, x, y, { font, size, underline, color }]
    })
  }

  if (txt.right) {
    const { fontPath, text, size, underline, color } = txt.right
    const font = pdfWriter.getFontForFile(fontPath)
    writeTextArguments.push(({ pageNumber, pagesCount, width }: PageInfo) => {
      const txt = text.replace('{page}', `${pageNumber}`).replace('{pages}', `${pagesCount}`)
      const textDimensions = font.calculateTextDimensions(txt, size)
      const x = width - (textDimensions.width + margin.right * PDF_POINTS_PER_MM)
      const y = margin.bottom * PDF_POINTS_PER_MM
      return [txt, x, y, { font, size, underline, color }]
    })
  }

  const editPage = (cxt: XObjectContentContext, pageInfo: PageInfo): void => {
    const { cm, q, writeText, Q } = cxt
    cm.apply(cxt, [1, 0, 0, -1, 0, pageInfo.height])
    q.apply(cxt)
    writeTextArguments.forEach(getArguments => writeText.apply(cxt, getArguments(pageInfo)))
    Q.apply(cxt)
  }

  const [, , width, height] = pdfReader.parsePage(0).getMediaBox()
  range(0, endPageNum - startPageNum).forEach(pageIndex => {
    const pageModifier = new PDFPageModifier(pdfWriter, pageIndex)
    const cxt = pageModifier.startContext().getContext()
    editPage(cxt, {
      width,
      height,
      pageNumber: startPageNum + pageIndex,
      pagesCount: totalPagesCount,
    })
    pageModifier.endContext().writePage()
  })

  pdfWriter.end()

  return outputBuffer.getBuffer()
}

export const mergePdfs = (target: Buffer, source: Buffer, margin: PrintMargin) => {
  const targetReader = createReader(new ReadStreamForBuffer(target))
  const targetFirstPage = targetReader.parsePage(0)
  const targetMediaBox = targetFirstPage.getMediaBox()
  const targetPagesCount = targetReader.getPagesCount()

  const sourceReader = createReader(new ReadStreamForBuffer(source))
  const sourcePagesCount = sourceReader.getPagesCount()
  if (sourcePagesCount < targetPagesCount) {
    throw new Error('Source pages count can not be smaller than target pages count!')
  }

  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriter(outputBuffer)
  const targetCopyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(target))
  const sourceCopyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(source))

  const left = margin.left * PDF_POINTS_PER_MM
  const bottom = targetMediaBox[3] - margin.bottom * PDF_POINTS_PER_MM

  range(0, targetPagesCount).forEach(pageIndex => {
    const page = pdfWriter.createPage.apply(pdfWriter, targetMediaBox)
    targetCopyCxt.mergePDFPageToPage(page, pageIndex)

    const formObjectId = sourceCopyCxt.createFormXObjectFromPDFPage(pageIndex, ePDFPageBoxMediaBox)
    pdfWriter
      .startPageContentContext(page)
      .q()
      .cm(1, 0, 0, -1, left, bottom)
      .doXObject(page.getResourcesDictionary().addFormXObjectMapping(formObjectId))
      .Q()

    pdfWriter.writePage(page)
  })

  pdfWriter.end()

  return outputBuffer.getBuffer()
}

export const appendPageToPdf = (target: Buffer, source: Buffer, sourcePageIndex: number) => {
  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriterToModify(new ReadStreamForBuffer(target), outputBuffer)
  const cpyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(source))
  cpyCxt.appendPDFPageFromPDF(sourcePageIndex)
  pdfWriter.end()
  return outputBuffer.getBuffer()
}

export const appendPdfs = (sources: Buffer[]) => {
  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriter(outputBuffer)
  sources
    .map(source => new ReadStreamForBuffer(source))
    .forEach(source => pdfWriter.appendPDFPagesFromPDF(source))
  pdfWriter.end()

  return outputBuffer.getBuffer()
}

export const getPagesCount = (pdfBuffer: Buffer): number => {
  const pdfReader = createReader(new ReadStreamForBuffer(pdfBuffer))
  return pdfReader.getPagesCount()
}
