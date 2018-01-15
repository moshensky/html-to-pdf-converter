import { range } from 'ramda'
import {
  createReader,
  createWriterToModify,
  PDFPageModifier,
  XObjectContentContext,
  WriteTextOptions,
  createWriter,
  ePDFPageBoxMediaBox,
  UsedFont,
} from 'hummus'
import { ReadStreamForBuffer } from './read-stream-for-buffer'
import { PDFStreamForBuffer } from './pdf-stream-for-buffer'
import { PrintMargin, TextSlot, PdfPoints, SlotType } from './types'

interface PageInfo {
  width: PdfPoints
  height: PdfPoints
  pageNumber: number
  pagesCount: number
}

type GetWriteTextArguments = (
  pageInfo: PageInfo,
) => {
  text: string
  x: PdfPoints
  y: PdfPoints
  txtOpts: {
    font: UsedFont
    size: PdfPoints
    underline: boolean
    color: number
  }
}

export interface AddFooterArgs {
  pdfBuffer: Buffer
  margin: PrintMargin
  txt: TextSlot
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
      const x = margin.left.toPdfPoints()
      const y = margin.bottom.toPdfPoints()
      return {
        text,
        x,
        y,
        txtOpts: { font, size: size.toPdfPoints(), underline: !!underline, color },
      }
    })
  }

  if (txt.right) {
    const { fontPath, text, size, underline, color } = txt.right
    const font = pdfWriter.getFontForFile(fontPath)
    writeTextArguments.push(({ pageNumber, pagesCount, width }: PageInfo) => {
      const txt = text.replace('{page}', `${pageNumber}`).replace('{pages}', `${pagesCount}`)
      const textDimensions = font.calculateTextDimensions(txt, size.toPdfPoints()._n)
      const x = width.subtract(
        PdfPoints.of(textDimensions.width + 5).add(margin.right.toPdfPoints()),
      )
      const y = margin.bottom.toPdfPoints()

      return {
        text: txt,
        x,
        y,
        txtOpts: { font, size: size.toPdfPoints(), underline: !!underline, color },
      }
    })
  }

  const editPage = (cxt: XObjectContentContext, pageInfo: PageInfo): void => {
    const { cm, q, writeText, Q } = cxt
    cm.apply(cxt, [1, 0, 0, -1, 0, pageInfo.height._n])
    q.apply(cxt)
    writeTextArguments.forEach(getArguments => {
      const { txtOpts, ...args } = getArguments(pageInfo)
      const { font, size, underline, color } = txtOpts
      const options: WriteTextOptions = { font, size: size._n, underline, color }
      writeText.apply(cxt, [args.text, args.x._n, args.y._n, options])
    })
    Q.apply(cxt)
  }

  const [, , width, height] = pdfReader.parsePage(0).getMediaBox()
  range(0, endPageNum - startPageNum).forEach(pageIndex => {
    const pageModifier = new PDFPageModifier(pdfWriter, pageIndex)
    const cxt = pageModifier.startContext().getContext()
    editPage(cxt, {
      width: PdfPoints.of(width),
      height: PdfPoints.of(height),
      pageNumber: startPageNum + pageIndex,
      pagesCount: totalPagesCount,
    })
    pageModifier.endContext().writePage()
  })

  pdfWriter.end()

  return outputBuffer.getBuffer()
}

export const mergePdfs = (target: Buffer, source: Buffer, margin: PrintMargin, type: SlotType) => {
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

  const left = margin.left.toPdfPoints()
  const yPos =
    type === 'footer'
      ? PdfPoints.of(targetMediaBox[3]).subtract(margin.bottom.toPdfPoints())
      : // TODO: find out that part
        PdfPoints.of(targetMediaBox[0]).subtract(margin.top.toPdfPoints())

  range(0, targetPagesCount).forEach(pageIndex => {
    const page = pdfWriter.createPage.apply(pdfWriter, targetMediaBox)
    targetCopyCxt.mergePDFPageToPage(page, pageIndex)

    const formObjectId = sourceCopyCxt.createFormXObjectFromPDFPage(pageIndex, ePDFPageBoxMediaBox)
    pdfWriter
      .startPageContentContext(page)
      .q()
      .cm(1, 0, 0, -1, left._n, yPos._n)
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
