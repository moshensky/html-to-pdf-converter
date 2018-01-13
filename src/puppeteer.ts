import * as puppeteer from 'puppeteer'
import { PrintMargin, PageSize } from './types'
import { Pixels, Millimeters } from './index'

export const getBodySize = async (page: puppeteer.Page): Promise<PageSize> => {
  const body = await page.$('html')
  if (!body) {
    throw new Error('Page have to have <body>!')
  }

  const sizeInPixels = await body.boundingBox()
  if (!sizeInPixels) {
    throw new Error('Page have to have <body>!')
  }

  return {
    width: Pixels.of(sizeInPixels.width).toMillimeters('ceil'),
    height: Pixels.of(sizeInPixels.height).toMillimeters('ceil'),
  }
}

export const mkSizedPdf = async (
  html: string,
  page: puppeteer.Page,
  size: PageSize,
  margin: PrintMargin = {
    top: Millimeters.of(0),
    right: Millimeters.of(0),
    bottom: Millimeters.of(0),
    left: Millimeters.of(0),
  },
) => {
  await page.setContent(html)
  await page.emulateMedia('screen')
  const pdfBuffer = await page.pdf({
    width: size.width.toString(),
    height: size.height.toString(),
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: margin.top.toString(),
      right: margin.right.toString(),
      bottom: margin.bottom.toString(),
      left: margin.left.toString(),
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
    width: Math.ceil(
      pageSize.width
        .subtract(margin.left)
        .subtract(margin.right)
        .toPixels()._n,
    ),
    height: Math.ceil(pageSize.height.toPixels()._n),
  }

  await page.setViewport(contentViewPort)
  await page.setContent(html)

  return getBodySize(page)
}
