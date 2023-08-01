import morgan from 'morgan'
import { AuthError, HTTPError } from '@/utils/errors'
import { AxiosError } from 'axios'
import express from 'express'
import z from 'zod'
import * as console from 'console'
import { stringToOptionalBoolean } from '@/utils/typeConversion'

morgan.token('body', (request: express.Request) => {
  return request.body ? JSON.stringify(request.body) : ''
})

export const logger = morgan(
  ':method :url :status :res[content-length] - :response-time ms :body'
)

export async function expansionQuery (request: express.Request, response: express.Response, next: express.NextFunction) {
  const expand = z.string().optional().parse(request.query.expand)
  request.expand = expand?.split(',') ?? []
  next()
}

export async function paginationQuery (request: express.Request, response: express.Response, next: express.NextFunction) {
  request.pagination = {
    limit: z.coerce.number().optional().parse(request.query.limit) ?? 50,
    next: z.string().nonempty().optional().parse(request.query.next),
    previous: z.string().nonempty().optional().parse(request.query.previous),
  }
  next()
}

export async function sortQuery (request: express.Request, response: express.Response, next: express.NextFunction) {
  const relevancePeriod = z.string().nonempty().optional().parse(request.query.relevancePeriod);
  request.sort = {
    field: z.string().nonempty().optional().parse(request.query.sort),
    relevancePeriod: relevancePeriod ? new Date(relevancePeriod) : undefined,
    ascending: stringToOptionalBoolean(request.query.ascending),
  }
  next()
}

export async function errorHandling (e: any, request: express.Request, response: express.Response, next: express.NextFunction) {
  if (e instanceof AuthError) {
    response.render('failedAuth.ejs', {
      data: JSON.stringify({
        success: false,
        message: e.message,
      }),
      originUrl: process.env.CORS_ORIGIN,
    })
  } else if (e instanceof HTTPError) {
    return response.status(e.httpCode).json({
      success: false,
      error: {
        message: e.message,
        code: e.code,
      },
    })
  } else if (e instanceof AxiosError) {
    return response.status(500).json({
      success: false,
      error: {
        message: e.cause?.message,
        code: 'ERROR_INTERNAL_AXIOS_ERROR',
      },
    })
  } else if (e instanceof Error) {
    console.error(e)
    return response.status(500).json({
      success: false,
      error: {
        message: e.message,
        code: 'ERROR_INTERNAL_SERVER_ERROR',
      },
    })
  } else {
    return response.status(500).json({
      success: false,
      error: {
        message: 'Server error.',
        code: 'ERROR_UNKNOWN',
      },
    })
  }
}
