import fs from 'fs'
import path from 'path'
import { randomName } from './random.js'
import JSZip from 'jszip'

export async function saveZip (zip: JSZip, outPath: string, filename?: string) {
  let savePath: string;
  await fs.promises.mkdir(outPath, {
    recursive: true
  })
  if (filename) {
    savePath = path.join(outPath, filename)
  } else {
    savePath = path.join(outPath, randomName() + '.zip')
  }
  const fileHandle = await fs.promises.open(savePath, 'w')
  await fileHandle.close()

  await new Promise<void>(resolve => {
    const zipStream = zip.generateNodeStream({
      streamFiles: true,
      type: 'nodebuffer'
    })
    const writeStream = fs.createWriteStream(savePath)
    zipStream.pipe(writeStream.on('finish', () => {
      writeStream.close()
      resolve()
    }))
  })
  return savePath
}
