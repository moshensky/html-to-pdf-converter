# html-to-pdf-converter

[![NPM version][npm-badge-url]][npm-url]
[![code style: prettier][prettier-badge-url]][prettier-url]
[![Build Status][travis-ci-badge-url]][travis-ci-url]
[![Coverage Status][coveralls-badge-url]][coveralls-url]

> HTML to PDF converter with support for HEADERS, FOOTERS and page numbers.

Using headless chrome via [puppeteer](https://github.com/GoogleChrome/puppeteer) and than modifying generated pdf via [HummusJS](https://github.com/galkahana/HummusJS) to add headers and footers with page numbers

## Install

```shell
npm install html-to-pdf-converter
```

## Usage

All fonts that are used inside passed html document need to be installed on the machine where the conversion is going to happen.
Headers and footers could be generated by passing either as a separate html document or as a single line that can be customized to `left`, `center` and `right` sections.
There are two special placeholders `{page}` and `{pages}` that could be used inside your document footers and headers, which are going to be replaced by current page number and total pages count respectively.
`mkCompoundPdf` accepts array of html documents that would be concatenated. Total page count is going to be the sum of the final generated pdf.
All documents had to be proper HTML documents. 

```ts
import { PrintMargin, pageSizeInMM, mkCompoundPdf, mkPdf } from 'html-to-pdf-converter'
const footerFontPath = join(
  __dirname, 'path_to_font/roboto-v18-latin_greek_cyrillic-regular.ttf',
)

// sizes are in millimeters
const footerFontSize = 10
const margin: PrintMargin = {
  top: 7.5,
  right: 15,
  bottom: 5,
  left: 17,
}

export const getPDFWithSimpleOneLineFooter= (document: string): Buffer => {
  return mkCompoundPdf([
    {
      pdfContent: document,
      footer: {
        type: 'TextHeaderFooter',
        left: {
          fontPath: footerFontPath,
          text: 'https://github.com/moshensky/html-to-pdf-converter',
          size: footerFontSize,
          underline: true,
          color: 0x0060bf, // '#0060bf'
        },
        right: {
          fontPath: footerFontPath,
          text: 'Page {page} of {pages}',
          size: footerFontSize,
          color: 0x000000, // '#000000'
        },
      },
      margin,
      pageSize: pageSizeInMM.A4.portrait,
    },
  ])
}

export const getPDFProtocolStream = (
  firstPage: string,
  firstPageFooter: string,
  restPages: string,
): Buffer => {
  return mkCompoundPdf([
    {
      pdfContent: firstPage,
      footer: {
        type: 'HtmlHeaderFooter',
        html: firstPageFooter,
      },
      margin,
      pageSize: pageSizeInMM.A4.portrait,
    },
    {
      pdfContent: restPages,
      footer: {
        type: 'TextHeaderFooter',
        left: {
          fontPath: footerFontPath,
          text: 'https://github.com/moshensky/html-to-pdf-converter',
          size: footerFontSize,
          underline: true,
          color: 0x0060bf, // '#0060bf'
        },
        right: {
          fontPath: footerFontPath,
          text: 'Page {page} of {pages}',
          size: footerFontSize,
          color: 0x000000, // '#000000'
        },
      },
      margin,
      pageSize: pageSizeInMM.A4.landscape,
    },
  ])
}

export const getPDFWithCustomSize = (document: string): Buffer =>
  mkPdf({
    pdfContent: document,
    margin: {
      top: 5,
      right: 5,
      bottom: 3,
      left: 5,
    },
    pageSize: {
      width: 62,
      height: 27,
    },
  })
```

## Roadmap

- add headers (asap in a day or two)
- document API
- provide more examples using `javascript`
- load document from URL, wait for all resources do be loaded (css, js, images, fonts, etc.), wait for javascript execution and than generate PDF
- setup CI
- cover with tests
- option to configure reusing chrome instances

## How to run tests

Docker is used to run tests due to minor difference in generated pdfs across various environments.

Build container:

```bash
docker build  -t html-to-pdf-converter .
```

To run tests (note that this will give rw rights to docker container to projects folder):

```bash
docker-compose run --rm converter npm run test
```

In watch mode:

```bash
docker-compose run --rm converter npm run test:watch
```

If pdf comparing tests would fail, an image diff would be generated inside `output` folder.

[npm-url]: https://www.npmjs.com/package/html-to-pdf-converter
[npm-badge-url]: https://img.shields.io/npm/v/html-to-pdf-converter.svg
[prettier-url]: https://github.com/prettier/prettier
[prettier-badge-url]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[travis-ci-url]: https://travis-ci.org/moshensky/html-to-pdf-converter
[travis-ci-badge-url]: https://travis-ci.org/moshensky/html-to-pdf-converter.svg?branch=master
[coveralls-badge-url]: https://coveralls.io/repos/github/moshensky/html-to-pdf-converter/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/moshensky/html-to-pdf-converter?branch=master

