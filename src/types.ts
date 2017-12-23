const mmPerInch = 25.4
export const BROWSER_POINTS_PER_MM = 96 / mmPerInch
export const PDF_POINTS_PER_MM = 72 / mmPerInch
export const pageSizeInMM = {
  A4: {
    portrait: { width: 210, height: 297 },
    landscape: { width: 297, height: 210 },
  },
}

export type Pixels = number
export type Millimeters = number
export type PdfPoints = number

export interface PdfText {
  fontPath: string
  text: string
  size: Millimeters
  underline?: boolean
  color?: number
}

export interface PrintMargin {
  top: Millimeters
  right: Millimeters
  bottom: Millimeters
  left: Millimeters
}

export interface SizeInPixels {
  width: Pixels
  height: Pixels
}

export interface PageSize {
  width: Millimeters
  height: Millimeters
}

export interface HtmlHeaderFooter {
  type: 'HtmlHeaderFooter'
  html: string
}

export interface StaticHeaderFooter {
  type: 'StaticHeaderFooter'
  left?: PdfText
  center?: PdfText
  right?: PdfText
}

export type HeaderFooterType = HtmlHeaderFooter | StaticHeaderFooter

export interface PdfContent {
  pdfContent: string
  margin: PrintMargin
  pageSize: PageSize
}

export interface ContentWithFooter extends PdfContent {
  footer: HeaderFooterType
}

export interface PDFWithEmptySpaceForFooter {
  pdf: Buffer
  margin: PrintMargin
  footerSize: SizeInPixels
  footer: HeaderFooterType
}

export interface PDFWithEmptySpaceForFooterAndPagesCount extends PDFWithEmptySpaceForFooter {
  pagesCount: number
}
