export * from './size'
export * from './transform-matrix'

export const unreachable: (x?: never) => never = () => {
  throw new Error('Unreachable code!')
}

export function unreachableOrElse<T>(_: never, t: T): T {
  return t
}
