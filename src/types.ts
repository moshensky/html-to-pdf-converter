import { unreachable } from './utils/index'

const mmPerInch = 25.4
const BROWSER_POINTS_PER_MM = 96 / mmPerInch
const PDF_POINTS_PER_MM = 72 / mmPerInch

export class PdfPoints {
  _n: number
  constructor(n: number) {
    this._n = n
  }

  static of(n: number): PdfPoints {
    return new PdfPoints(n)
  }

  add(x: PdfPoints) {
    return new PdfPoints(this._n + x._n)
  }

  subtract(x: PdfPoints) {
    return new PdfPoints(this._n - x._n)
  }
}

export class Millimeters {
  _n: number
  constructor(n: number) {
    this._n = n
  }

  static of(n: number): Millimeters {
    return new Millimeters(n)
  }

  static max = (a: Millimeters, b: Millimeters) => Millimeters.of(Math.max(a._n, b._n))

  add(x: Millimeters) {
    return new Millimeters(this._n + x._n)
  }

  subtract(x: Millimeters) {
    return new Millimeters(this._n - x._n)
  }

  toPixels(): Pixels {
    // tslint:disable-next-line no-use-before-declare
    return Pixels.of(this._n * BROWSER_POINTS_PER_MM)
  }

  toPdfPoints(): PdfPoints {
    return PdfPoints.of(this._n * PDF_POINTS_PER_MM)
  }

  toString() {
    return `${this._n}mm`
  }
}

export type RoundType = 'none' | 'floor' | 'ceil'

export class Pixels {
  _n: number
  constructor(n: number) {
    this._n = n
  }

  static of(n: number): Pixels {
    return new Pixels(n)
  }

  toMillimeters(type: RoundType): Millimeters {
    switch (type) {
      case 'none':
        return Millimeters.of(this._n / BROWSER_POINTS_PER_MM)
      case 'floor':
        return Millimeters.of(Math.floor(this._n / BROWSER_POINTS_PER_MM))
      case 'ceil':
        return Millimeters.of(Math.ceil(this._n / BROWSER_POINTS_PER_MM))
      default:
        return unreachable(type)
    }
  }

  toString() {
    return `${this._n}px`
  }
}

export const pageSizeInMM = {
  A4: {
    portrait: { width: Millimeters.of(210), height: Millimeters.of(297) },
    landscape: { width: Millimeters.of(297), height: Millimeters.of(210) },
  },
}

export interface PdfText {
  fontPath: string
  text: string
  size: Millimeters
  underline?: boolean
  color: number
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

export interface TextHeaderFooter {
  type: 'TextHeaderFooter'
  left?: PdfText
  center?: PdfText
  right?: PdfText
}

export type HeaderFooterType = HtmlHeaderFooter | TextHeaderFooter

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
  footerSize: PageSize
  footer: HeaderFooterType
}

export interface PDFWithEmptySpaceForFooterAndPagesCount extends PDFWithEmptySpaceForFooter {
  pagesCount: number
}
