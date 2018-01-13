import { readFileSync } from 'fs'
import { join } from 'path'

import { mkCompoundPdf, MkPdfOptions } from '../src/compound-pdf'
import { PrintMargin, pageSizeInMM } from '../src/types'
import { Millimeters } from './index'
import { compareToExpectedMultiple, compareToExpected } from './utils/test-helpers'

// const headerHtml = readFileSync(join(__dirname, './test-files/header.html'), 'utf8')
const footerHtml = readFileSync(join(__dirname, './test-files/footer.html'), 'utf8')
const firstPageHtml = readFileSync(join(__dirname, './test-files/first-page.html'), 'utf8')
const resultsHtml = readFileSync(join(__dirname, './test-files/results.html'), 'utf8')

const fontPath = join(__dirname, '../fonts/roboto-v18-latin_greek_cyrillic-regular.ttf')
const footerFontSize = Millimeters.of(4.2)

const margin: PrintMargin = {
  top: Millimeters.of(7.5),
  right: Millimeters.of(15),
  bottom: Millimeters.of(5),
  left: Millimeters.of(17),
}

// TODO: find out how to run without those options
// Travis-CI Docker image workaround
const puppeteerOptions: MkPdfOptions = {
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
}

describe('mkCompoundPdf()', () => {
  it('text footer', async () => {
    const pdfBuffer = await mkCompoundPdf(
      [
        {
          pdfContent: firstPageHtml,
          footer: {
            type: 'TextHeaderFooter',
            left: {
              fontPath: fontPath,
              text: 'https://github.com/moshensky/html-to-pdf-converter',
              size: footerFontSize,
              underline: true,
              color: 0x0060bf, // '#0060bf'
            },
            right: {
              fontPath: fontPath,
              text: 'Page {page} of {pages}',
              size: footerFontSize,
              color: 0x000000, // '#000000'
            },
          },
          margin,
          pageSize: pageSizeInMM.A4.portrait,
        },
      ],
      puppeteerOptions,
    )

    await compareToExpected('textFooter', pdfBuffer, false)
  })

  it('html footer', async () => {
    const pdfBuffer = await mkCompoundPdf(
      [
        {
          pdfContent: firstPageHtml,
          footer: {
            type: 'HtmlHeaderFooter',
            html: footerHtml,
          },
          margin,
          pageSize: pageSizeInMM.A4.portrait,
        },
        {
          pdfContent: resultsHtml,
          footer: {
            type: 'HtmlHeaderFooter',
            html: footerHtml,
          },
          margin,
          pageSize: pageSizeInMM.A4.landscape,
        },
      ],
      puppeteerOptions,
    )

    await compareToExpectedMultiple('htmlFooter', pdfBuffer, false)
  })
})
