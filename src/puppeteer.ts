import * as puppeteer from 'puppeteer'
import { PrintMargin, PageSize, BROWSER_POINTS_PER_MM } from './types'

export const getBodySize = async (page: puppeteer.Page): Promise<PageSize> => {
  const body = await page.$('body')
  if (!body) {
    throw new Error('Page have to have <body>!')
  }

  const size = await body.boundingBox()
  if (!size) {
    throw new Error('Page have to have <body>!')
  }

  return {
    width: Math.ceil(size.width / BROWSER_POINTS_PER_MM),
    height: Math.ceil(size.height / BROWSER_POINTS_PER_MM),
  }
}

export const mkSizedPdf = async (
  html: string,
  page: puppeteer.Page,
  size: PageSize,
  margin: PrintMargin = { top: 0, right: 0, bottom: 0, left: 0 },
) => {
  await page.setContent(html)
  const pdfBuffer = await page.pdf({
    width: `${size.width}mm`,
    height: `${size.height}mm`,
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: `${margin.top}mm`,
      right: `${margin.right}mm`,
      bottom: `${margin.bottom}mm`,
      left: `${margin.left}mm`,
    },
  })

  return pdfBuffer
}

export const calcContentSize = async (
  html: string,
  pageSize: PageSize,
  margin: PrintMargin,
  page: puppeteer.Page,
) => {
  const contentViewPort = {
    width: Math.ceil((pageSize.width - margin.left - margin.right) * BROWSER_POINTS_PER_MM),
    height: Math.ceil(pageSize.height * BROWSER_POINTS_PER_MM),
  }
  await page.setViewport(contentViewPort)
  await page.setContent(html)

  return getBodySize(page)
}
