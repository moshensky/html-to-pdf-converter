import { range } from 'ramda'
import * as path from 'path'
import * as fs from 'fs'

const mkPageBreakDiv = (content: string) => `<div style="page-break-after: always">${content}</div>`

export const propagatePageNumbers = (
  html: string,
  startPageNum: number,
  endPageNumber: number,
  totalPagesCount: number,
) => {
  const [head, rest] = html.split(/<body>/i)
  if (!rest) {
    throw new Error('Malformed html!')
  }

  const [body, foot] = rest.split(/<\/body>/i)
  if (!foot) {
    throw new Error('Malformed html!')
  }

  const content = range(startPageNum, endPageNumber)
    .map(pageNum =>
      body.replace(/{page}/g, pageNum.toString()).replace(/{pages}/g, totalPagesCount.toString()),
    )
    .map(mkPageBreakDiv)
    .join('')

  return `${head}<body>${content}</body>${foot}`
}

export const saveBufferToFile = (buffer: Buffer, filePath: string): void => {
  const ws = fs.createWriteStream(path.join(__dirname, '..', 'output', filePath))
  ws.write(buffer)
  ws.end()
}
