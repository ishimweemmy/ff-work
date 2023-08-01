import axios from 'axios'
import mime from 'mime-types'
import path from 'path'
import { randomName } from './random.js'
import fs from 'fs'
import { algorithmServer } from './api.js'
import { AxiosResponse } from 'axios'

async function _saveAxiosResponse (response: AxiosResponse, location: string, filename?: string) {
  let extension = ''
  const mimeType = response.headers?.['content-type']
  if (mimeType) {
    extension = '.' + mime.extension(mimeType)
  }
  const stream = response.data
  let filepath
  if (filename) {
    filepath = path.join(location, filename)
  } else {
    if (!response.config.baseURL || !response.config.url) {
      throw new Error('Cannot download file - URL is empty.')
    }
    filepath = path.join(location, path.parse(new URL(response.config.baseURL + response.config.url).pathname).name + '_' + randomName() + extension)
  }
  await fs.promises.mkdir(location, { recursive: true })
  const handle = await fs.promises.open(filepath, 'w')
  await handle.close()
  const writeStream = fs.createWriteStream(filepath)
  await new Promise<void>((resolve, reject) => {
    stream.pipe(writeStream.on('finish', () => {
      writeStream.close()
      resolve()
    }).on('error', (err) => {
      reject(err)
    }))
  })

  return filepath
}

export default async function download (url: string, location: string, filename?: string) {
  const response = await axios.get(url, {
    responseType: 'stream'
  })
  return await _saveAxiosResponse(response, location, filename)
}


export async function downloadApiResult(fileId: string, location: string, filename?: string) {
  const response = await algorithmServer.get(`/get-files/${fileId}`, {
    responseType: 'stream'
  })
  return await _saveAxiosResponse(response, location, filename)
}
