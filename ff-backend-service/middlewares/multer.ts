import multer, { FileFilterCallback } from 'multer'
import typeIs from 'type-is'
import express from 'express'

export const imageParser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter (request, file, callback) {
    if (!typeIs.is(file.mimetype, ['png', 'jpg', 'jpeg', 'webp'])) {
      callback(new Error('This file format is not allowed!'))
    }
    return callback(null, true)
  }
})

export function customParserFactory ({ fileTypes = [], fileFilter, ...props }: {
  fileTypes: string[],
  fileFilter?: (req: express.Request, file: Express.Multer.File, callback: FileFilterCallback) => void,
}) {
  return multer({
    storage: multer.diskStorage({
      destination: '/tmp',
    }),
    ...props,
    fileFilter (request, file, callback) {
      if (!typeIs.is(file.mimetype, fileTypes)) {
        return callback(new Error('This file format is not allowed!'))
      }
      if (fileFilter) {
        return fileFilter(request, file, callback)
      } else {
        callback(null, true)
      }
    }
  })
}

export const textParser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter (request, file, callback) {
    if (!typeIs.is(file.mimetype, ['text/*', 'application/json'])) {
      callback(new Error('This file format is not allowed!'))
    }
    return callback(null, true)
  }
})

export const miscParser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})