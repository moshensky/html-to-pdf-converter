import { range } from 'ramda'
import {
  createReader,
  createWriterToModify,
  XObjectContentContext,
  WriteTextOptions,
  createWriter,
  ePDFPageBoxMediaBox,
  UsedFont,
} from 'hummus'
import { ReadStreamForBuffer } from './read-stream-for-buffer'
import { PDFStreamForBuffer } from './pdf-stream-for-buffer'
import { PrintMargin, TextSlot, PdfPoints, SlotType, PageSize } from './types'

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

const editPage = (
  cxt: XObjectContentContext,
  pageInfo: PageInfo,
  writeTextArguments: ReadonlyArray<GetWriteTextArguments>,
): void => {
  const { q, writeText, Q } = cxt
  q.apply(cxt)
  writeTextArguments.forEach(getArguments => {
    const { txtOpts, ...args } = getArguments(pageInfo)
    const { font, size, underline, color } = txtOpts
    const options: WriteTextOptions = { font, size: size._n, underline, color }
    writeText.apply(cxt, [args.text, args.x._n, args.y._n, options])
  })
  Q.apply(cxt)
}

export const addFooter = (args: AddFooterArgs) => {
  const { pdfBuffer, margin, txt, startPageNum, endPageNum, totalPagesCount } = args
  const pdfReader = createReader(new ReadStreamForBuffer(pdfBuffer))

  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriter(outputBuffer)

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

  const buffer1MediaBox = pdfReader.parsePage(0).getMediaBox()
  const buffer1CpyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(pdfBuffer))
  const [, , width, height] = buffer1MediaBox
  range(0, endPageNum - startPageNum).forEach(pageIndex => {
    const page = pdfWriter.createPage.apply(pdfWriter, buffer1MediaBox)
    const formObjectId = buffer1CpyCxt.createFormXObjectFromPDFPage(pageIndex, ePDFPageBoxMediaBox)

    const cxt = pdfWriter
      .startPageContentContext(page)
      .q()
      .doXObject(page.getResourcesDictionary().addFormXObjectMapping(formObjectId))
      .Q()

    editPage(
      cxt,
      {
        width: PdfPoints.of(width),
        height: PdfPoints.of(height),
        pageNumber: startPageNum + pageIndex,
        pagesCount: totalPagesCount,
      },
      writeTextArguments,
    )

    pdfWriter.writePage(page)
  })

  pdfWriter.end()

  return outputBuffer.getBuffer()
}

export const mergePdfs = (
  buffer1: Buffer,
  buffer2: Buffer,
  margin: PrintMargin,
  type: SlotType,
  slotSize: PageSize,
) => {
  const reader1 = createReader(new ReadStreamForBuffer(buffer1))
  const reader2 = createReader(new ReadStreamForBuffer(buffer2))

  const buffer1PagesCount = reader1.getPagesCount()
  const buffer2PagesCount = reader2.getPagesCount()
  if (buffer2PagesCount < buffer1PagesCount) {
    throw new Error('Source pages count can not be smaller than target pages count!')
  }

  const outputBuffer = new PDFStreamForBuffer()
  const pdfWriter = createWriter(outputBuffer)

  const buffer1CpyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(buffer1))
  const buffer2CpyCxt = pdfWriter.createPDFCopyingContext(new ReadStreamForBuffer(buffer2))

  const buffer1MediaBox = reader1.parsePage(0).getMediaBox()
  const left = margin.left.toPdfPoints()
  const top =
    type === 'footer'
      ? margin.bottom.toPdfPoints()
      : PdfPoints.of(buffer1MediaBox[3]).subtract(
          slotSize.height.toPdfPoints().add(margin.top.toPdfPoints()),
        )

  range(0, buffer1PagesCount).forEach(pageIndex => {
    const page = pdfWriter.createPage.apply(pdfWriter, buffer1MediaBox)

    const buffer1FormObjectId = buffer1CpyCxt.createFormXObjectFromPDFPage(
      pageIndex,
      ePDFPageBoxMediaBox,
    )
    const buffer2FormObjectId = buffer2CpyCxt.createFormXObjectFromPDFPage(
      pageIndex,
      ePDFPageBoxMediaBox,
    )

    pdfWriter
      .startPageContentContext(page)
      .q()
      .doXObject(page.getResourcesDictionary().addFormXObjectMapping(buffer1FormObjectId))
      .cm(1, 0, 0, 1, left._n, top._n)
      .doXObject(page.getResourcesDictionary().addFormXObjectMapping(buffer2FormObjectId))
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
