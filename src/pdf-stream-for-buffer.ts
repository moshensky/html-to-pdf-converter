import { WriteStream } from 'hummus'
import { Buffer } from 'buffer'

export class PDFStreamForBuffer implements WriteStream {
  private totalLength = 0
  private buffers: Buffer[] = []

  write(inBytesArray: any[]): number {
    if (inBytesArray.length > 0) {
      this.buffers.push(Buffer.from(inBytesArray))
      this.totalLength += inBytesArray.length
      return inBytesArray.length
    }

    return 0
  }

  getCurrentPosition(): number {
    return this.totalLength
  }

  getBuffer() {
    return Buffer.concat(this.buffers, this.totalLength)
  }
}
