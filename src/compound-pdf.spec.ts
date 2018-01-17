import { readFileSync } from 'fs'
import { join } from 'path'

import { PrintMargin, pageSizeInMM } from '../src/types'
import { initialize, MkPdfOptions, HtmlToPdfConverter, Millimeters } from './index'
import { compareToExpectedMultiple, compareToExpected } from './utils/test-helpers'

const headerHtml = readFileSync(join(__dirname, './test-files/header.html'), 'utf8')
const footerHtml = readFileSync(join(__dirname, './test-files/footer.html'), 'utf8')
const firstPageHtml = readFileSync(join(__dirname, './test-files/first-page.html'), 'utf8')
const resultsHtml = readFileSync(join(__dirname, './test-files/results.html'), 'utf8')

const fontPath = join(__dirname, '../fonts/roboto-v18-latin_greek_cyrillic-regular.ttf')
const footerFontSize = Millimeters.of(4.2)

const margin: PrintMargin = PrintMargin.ofMillimeters({
  top: 7.5,
  right: 15,
  bottom: 5,
  left: 17,
})

const TEST_TIMEOUT = 10000 // 10 seconds
const OUTPUT_NEW_EXPECTED_FILES = false

let converter: HtmlToPdfConverter

beforeAll(async () => {
  // TODO: find out how to run without those options
  // Travis-CI Docker image workaround
  const puppeteerOptions: MkPdfOptions = {
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  }

  converter = await initialize(puppeteerOptions)
})

afterAll(async () => {
  await converter.destroy()
})

describe('mkCompoundPdf()', () => {
  it(
    'text footer',
    async () => {
      const pdfBuffer = await converter.mkCompoundPdf([
        {
          pdfContent: firstPageHtml,
          footer: {
            type: 'TextSlot',
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
      ])

      await compareToExpected('textFooter', pdfBuffer, OUTPUT_NEW_EXPECTED_FILES)
    },
    TEST_TIMEOUT,
  )

  // TODO: create different footer in order to see obvious differences
  it(
    'multiple pages with different html footers',
    async () => {
      const pdfBuffer = await converter.mkCompoundPdf([
        {
          pdfContent: firstPageHtml,
          footer: {
            type: 'HtmlSlot',
            html: footerHtml,
          },
          margin,
          pageSize: pageSizeInMM.A4.portrait,
        },
        {
          pdfContent: resultsHtml,
          footer: {
            type: 'HtmlSlot',
            html: footerHtml,
          },
          margin,
          pageSize: pageSizeInMM.A4.landscape,
        },
      ])

      await compareToExpectedMultiple('htmlFooter', pdfBuffer, OUTPUT_NEW_EXPECTED_FILES)
    },
    TEST_TIMEOUT,
  )

  it(
    'single page with html header',
    async () => {
      const pdfBuffer = await converter.mkCompoundPdf([
        {
          pdfContent: firstPageHtml,
          header: {
            type: 'HtmlSlot',
            html: headerHtml,
          },
          margin,
          pageSize: pageSizeInMM.A4.portrait,
        },
      ])

      await compareToExpected('singlePageWithHtmlHeader', pdfBuffer, OUTPUT_NEW_EXPECTED_FILES)
    },
    TEST_TIMEOUT,
  )
})
