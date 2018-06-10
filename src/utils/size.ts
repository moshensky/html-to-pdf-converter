import { RectangleDimension, Height, Width } from 'hummus'

export const getRelativeHeight = (dimension: RectangleDimension, relativeWidth: Width): Height =>
  (relativeWidth * dimension.height) / dimension.width

export const getRelativeWidth = (dimension: RectangleDimension, relativeHeight: Height): Width =>
  (relativeHeight * dimension.width) / dimension.height
