import { readFileSync } from 'fs'
import { join } from 'path'
import { PrintMargin } from './index'
import { pageSizeInMM } from './types'
import { MkPdfOptions, HtmlToPdfConverter, initialize } from './compound-pdf'

const headerHtml = readFileSync(join(__dirname, './test-files/header.html'), 'utf8')
const firstPageHtml = readFileSync(join(__dirname, './test-files/first-page.html'), 'utf8')

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
describe('mkCompoundPdf() perf', () => {
  const mkPdf = () =>
    converter.mkCompoundPdf([
      {
        pdfContent: firstPageHtml,
        header: {
          type: 'HtmlSlot',
          html: headerHtml,
        },
        margin: PrintMargin.ofZero(),
        pageSize: pageSizeInMM.A4.portrait,
      },
    ])

  it.skip(
    'single page with html header',
    async () => {
      await Promise.all([
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
        mkPdf(),
      ])
    },
    20000,
  )
})
