import { unreachableOrElse } from './utils/index'

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
        return unreachableOrElse(type, Millimeters.of(NaN))
    }
  }

  toString() {
    return `${this._n}px`
  }
}

export interface PdfText {
  fontPath: string
  text: string
  size: Millimeters
  underline?: boolean
  color: number
}

export interface Margin<T> {
  top: T
  right: T
  bottom: T
  left: T
}

export interface PrintMargin extends Margin<Millimeters> {}

export type SlotType = 'header' | 'footer'

export const PrintMargin = {
  ofMillimeters: ({ top, right, bottom, left }: Margin<number>): PrintMargin => ({
    top: Millimeters.of(top),
    right: Millimeters.of(right),
    bottom: Millimeters.of(bottom),
    left: Millimeters.of(left),
  }),
  ofZero: () => ({
    top: Millimeters.of(0),
    right: Millimeters.of(0),
    bottom: Millimeters.of(0),
    left: Millimeters.of(0),
  }),
}

export interface SizeInPixels {
  width: Pixels
  height: Pixels
}

export interface PageSize {
  width: Millimeters
  height: Millimeters
}

export const PageSize = {
  of: (width: number, height: number) => ({
    width: Millimeters.of(width),
    height: Millimeters.of(height),
  }),
  ofZero: () => ({
    width: Millimeters.of(0),
    height: Millimeters.of(0),
  }),
}

export interface HtmlSlot {
  type: 'HtmlSlot'
  html: string
}

export interface TextSlot {
  type: 'TextSlot'
  left?: PdfText
  center?: PdfText
  right?: PdfText
}

export type Slot = HtmlSlot | TextSlot

export interface PdfContent {
  pdfContent: string
  margin: PrintMargin
  pageSize: PageSize
}

export interface PdfContentWithSlots extends PdfContent {
  header?: Slot
  footer?: Slot
}

export interface SlotWithPageSize {
  readonly size: PageSize
  readonly data: Slot
}

export interface PdfWithSpaceForSlots {
  readonly mainPdf: Buffer
  readonly margin: PrintMargin
  readonly header?: SlotWithPageSize
  readonly footer?: SlotWithPageSize
}

export const pageSizeInMM = {
  A4: {
    portrait: PageSize.of(210, 297),
    landscape: PageSize.of(297, 210),
  },
}
