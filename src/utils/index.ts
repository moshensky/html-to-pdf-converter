export * from './size'
export * from './transform-matrix'

export function unreachable(_: never) {
  throw new Error('Unreachable code!')
}

export function unreachableOrElse<T>(_: never, t: T): T {
  return t
}
