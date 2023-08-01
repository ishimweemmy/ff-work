import * as config from '@/utils/config'
import { randomName } from '@/utils/random'
import {
  DeleteObjectsCommand,
  S3Client,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectAclCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import process from 'process'
import { S3 } from 'aws-sdk'
import { CannedACL } from 'aws-sdk/clients/glacier'

export const client = new S3Client(config.S3_CONFIG)
export const managedClient = new S3(config.S3_CONFIG)

export const upload = async (bucketName = config.BUCKET_NAME, body: Buffer | ReadableStream, options: { fileName?: string, contentType?: string, ACL?: CannedACL }) => {
  let fileName = options.fileName ?? randomName()
  let contentType = options.contentType ?? 'image/jpeg'

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: body,
    ContentType: contentType,
    ACL: options.ACL,
  }

  return managedClient.upload(params).promise()
}

export const cloneObject = async (bucketName = config.BUCKET_NAME, source: string, target: string, params?: {
  ACL: CannedACL
}) => {
  return managedClient.copyObject({
    Bucket: bucketName,
    CopySource: `${bucketName}/${source}`,
    Key: `${target}`,
    ACL: params?.ACL,
  }).promise()
}

export const getObject = async (bucketName = config.BUCKET_NAME, target: string) => {
  return managedClient.getObject({
    Bucket: bucketName,
    Key: target,
  }).promise()
}

export const deleteMany = async (bucketName = config.BUCKET_NAME, objectKeys: string[]) => {
  const objectsArray = objectKeys.map(key => {
    return { Key: key }
  })
  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: objectsArray
    }
  }
  const command = new DeleteObjectsCommand(params)
  await client.send(command)
}

export async function getSignedUrlOfObject (bucketName = config.BUCKET_NAME, key: string) {
  const getObjectParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  }
  const command = new GetObjectCommand(getObjectParams)
  return await getSignedUrl(client, command, { expiresIn: 86400 })
}

export async function changePermissionOfObject (bucketName = config.BUCKET_NAME, key: string, permission: ObjectCannedACL) {
  await client.send(new PutObjectAclCommand({
    ACL: permission,
    Key: key,
    Bucket: bucketName,
  }))
}

export async function getPublicUrl (bucketName = config.BUCKET_NAME, key: string) {
  const endpoint = await client.config.endpoint?.()
  if (!endpoint) {
    throw new Error('Missing AWS S3 endpoint!')
  }
  return `https://${bucketName}.${endpoint.hostname}/${key}`
}
