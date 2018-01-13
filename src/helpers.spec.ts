import { propagatePageNumbers } from './helpers'

describe('propagatePageNumbers()', () => {
  it('should throw when opening <body> tag is missing', () => {
    expect(() => propagatePageNumbers('', 1, 1, 1)).toThrow('Malformed html!')
  })

  it('should throw when closing </body> tag is missing', () => {
    expect(() => propagatePageNumbers('<body> ', 1, 1, 1)).toThrow('Malformed html!')
  })

  const html = '<html><body>{page} / {pages}</body></html>'
  it('should get new html', () => {
    expect(propagatePageNumbers(html, 1, 2, 1)).toEqual(
      '<html><body><div style="page-break-after: always">1 / 1</div></body></html>',
    )
  })

  it('should get propagated html', () => {
    expect(propagatePageNumbers(html, 3, 7, 9)).toEqual(
      '<html><body><div style="page-break-after: always">3 / 9</div><div style="page-break-after: always">4 / 9</div><div style="page-break-after: always">5 / 9</div><div style="page-break-after: always">6 / 9</div></body></html>',
    )
  })
})
