// https://github.com/chrvadala/transformation-matrix
export const translate = (
  x: number,
  y: number,
): [number, number, number, number, number, number] => [1, 0, 0, 1, x, y]
/**
 * < 1 scale down
 * > 1 scale up
 * @param x scale along the x axis
 * @param y scale along the y axis
 */
export const scale = (x: number, y: number): [number, number, number, number, number, number] => [
  x,
  0,
  0,
  y,
  0,
  0,
]
