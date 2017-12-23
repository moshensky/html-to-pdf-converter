import { getRelativeHeight, getRelativeWidth } from './size'
import { RectangleDimension } from 'hummus'

const dimension: RectangleDimension = {
  width: 1000,
  height: 500,
}

describe('getRelativeHeight()', () => {
  it('should return height', () => {
    expect(getRelativeHeight(dimension, 500)).toEqual(250)
  })
})

describe('getRelativeWidth()', () => {
  it('should return width', () => {
    expect(getRelativeWidth(dimension, 250)).toEqual(500)
  })
})
