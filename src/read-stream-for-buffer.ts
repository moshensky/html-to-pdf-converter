import { ReadStream } from 'hummus'

export class ReadStreamForBuffer implements ReadStream {
  private position = 0

  constructor(private buffer: Buffer) {}

  read(inAmount: number): number[] {
    const length =
      inAmount + this.position > this.buffer.length ? this.buffer.length : inAmount + this.position
    const result = [] as number[]
    for (let index = this.position; index < length; index += 1) {
      result.push(this.buffer[index])
    }

    this.position += inAmount

    return result
  }

  notEnded(): boolean {
    return this.position < this.buffer.length
  }

  setPosition(position: number): void {
    this.position = position
  }

  setPositionFromEnd(position: number): void {
    this.position = this.buffer.length - position
  }

  skip(amount: number): void {
    this.position += amount
  }

  getCurrentPosition(): number {
    return this.position
  }
}
