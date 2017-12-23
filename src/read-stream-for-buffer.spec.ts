import { ReadStreamForBuffer } from './read-stream-for-buffer'

describe('ReadStreamForBuffer', () => {
  const buffer = Buffer.from('тест')

  it('should read()', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    expect(readStream.read(2)).toEqual([209, 130])
    expect(readStream.getCurrentPosition()).toEqual(2)
  })

  it('should read() not more than buffer length', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    expect(readStream.read(20).length).toEqual(8)
  })

  it('should be notEnded()', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    expect(readStream.notEnded()).toEqual(true)
  })

  it('should setPosition()', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    readStream.setPosition(3)
    expect(readStream.getCurrentPosition()).toEqual(3)
  })

  it('should setPositionFromEnd()', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    readStream.setPositionFromEnd(3)
    expect(readStream.getCurrentPosition()).toEqual(5)
  })

  it('should skip()', () => {
    const readStream = new ReadStreamForBuffer(buffer)
    readStream.skip(3)
    expect(readStream.getCurrentPosition()).toEqual(3)
  })
})
