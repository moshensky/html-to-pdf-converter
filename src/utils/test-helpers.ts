import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, basename, extname } from 'path'
import * as gm from 'gm'
import * as glob from 'glob'
import { zip } from 'ramda'

const getFilePaths = (filePath: string, pattern: string): Promise<ReadonlyArray<string>> =>
  new Promise((resolve, reject) => {
    glob(`${filePath}/${pattern}`, { nodir: true, ignore: ['*.diff.*'] }, (err, files) => {
      return err ? reject(err) : resolve(files)
    })
  })

const savePdfToPng = (filePath: string, pdfBuffer: Buffer): Promise<void> =>
  new Promise((resolve, reject) => {
    gm(pdfBuffer, `${basename(filePath, extname(filePath))}.pdf`)
      .density(300, 300)
      // @ts-ignore
      .out('-append')
      .write(filePath, (err: any) => (err ? reject(err) : resolve()))
  })

const savePdfToPngs = (filePath: string, fileName: string, pdfBuffer: Buffer): Promise<void> =>
  new Promise((resolve, reject) => {
    gm(pdfBuffer, `${basename(filePath, extname(filePath))}.pdf`)
      .density(300, 300)
      // TODO: create pr to definitely typed
      // @ts-ignore
      .out('+adjoin')
      .write(`${join(filePath, fileName)}%02d.png`, (err: any) => (err ? reject(err) : resolve()))
  })

interface CompareImagesResult {
  readonly isEqual: boolean
  readonly raw: number
  readonly equality: number
}
const compareImages = (
  expectedPath: string,
  resultPngPath: string,
  tolerance: number = 0,
): Promise<CompareImagesResult> =>
  new Promise((resolve, reject) => {
    gm.compare(expectedPath, resultPngPath, { tolerance }, (err, isEqual, equality, raw) => {
      if (err) {
        return reject(err)
      }

      // TODO: use DEBUG package
      // console.log('The images were equal: %s', isEqual)
      // console.log('Actual equality: %d', equality)
      // console.log(raw)
      if (isEqual === false) {
        const options = {
          file: `${resultPngPath}.diff.png`,
          highlightColor: 'yellow',
          tolerance,
        }

        gm.compare(expectedPath, resultPngPath, options, () => {
          resolve({ isEqual, equality, raw })
        })
      } else {
        resolve({ isEqual, equality, raw })
      }
    })
  })

const expectedPath = join(__dirname, '../../expected')
const outputPath = join(__dirname, '../../output')

// TODO: quick hack
if (!existsSync(outputPath)) {
  mkdirSync(outputPath)
}

export const compareToExpected = async (
  fileName: string,
  pdfBuffer: Buffer,
  mkSnapshot: boolean = false,
) => {
  const expectedImagePath = join(expectedPath, `${fileName}.png`)
  if (mkSnapshot) {
    writeFileSync(join(expectedPath, `${fileName}.pdf`), pdfBuffer)
    await savePdfToPng(expectedImagePath, pdfBuffer)
  }

  const resultImagePath = join(outputPath, `${fileName}.png`)
  await savePdfToPng(resultImagePath, pdfBuffer)
  const { isEqual } = await compareImages(expectedImagePath, resultImagePath)
  expect(isEqual).toEqual(true)
}

export const compareToExpectedMultiple = async (
  fileName: string,
  pdfBuffer: Buffer,
  mkSnapshot: boolean = false,
) => {
  if (mkSnapshot) {
    writeFileSync(join(expectedPath, `${fileName}.pdf`), pdfBuffer)
    await savePdfToPngs(expectedPath, fileName, pdfBuffer)
  }

  await savePdfToPngs(outputPath, fileName, pdfBuffer)

  const [expectedFilePaths, resultFilePaths] = await Promise.all([
    getFilePaths(expectedPath, `${fileName}+([0-9]).png`),
    getFilePaths(outputPath, `${fileName}+([0-9]).png`),
  ])

  expect(expectedFilePaths.length).toEqual(resultFilePaths.length)

  const results = (await Promise.all(
    zip(expectedFilePaths, resultFilePaths).map(([expectedImagePath, resultImagePath]) =>
      compareImages(expectedImagePath, resultImagePath),
    ),
  )).map(({ isEqual }) => isEqual)

  expect(results.every(x => x === true)).toEqual(true)
}
