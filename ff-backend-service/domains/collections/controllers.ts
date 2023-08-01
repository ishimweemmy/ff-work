import CollectionService from './service'
import express from 'express'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'
import { FileMissingError } from '@/utils/errors'

export async function getCollections (
    request: express.Request,
    response: express.Response,
) {
    const results = await new CollectionService(
        request.user!
    ).getCollections({
        expand: request.expand,
        pagination: request.pagination,
    })
    response.json({
        success: true,
        ...results
    })
}

export async function searchCollections (
    request: express.Request,
    response: express.Response,
) {
    const result = await new CollectionService(
        request.user!
    ).searchCollections({
        name: z.string().optional().parse(request.query.name),
        sort: z.string().optional().parse(request.query.sort),
        expand: request.expand,
        pagination: request.pagination,
    })
    response.json({
        success: true,
        ...result,
    })
}

export async function createCollection (
    request: express.Request,
    response: express.Response,
) {
    const createParams = {
        type: z.enum(['image', 'video']).parse(request.body.type),
        name: z.string().nonempty().parse(request.body.name),
        description: z.string().nonempty().parse(request.body.description),
        tags: z.array(z.string()).optional().parse(request.body.tags),
        visibility: z.boolean().optional().parse(request.body.visibility),
    }
    const result = await new CollectionService(request.user!).createCollection(createParams)
    response.json({
        success: true,
        data: result.toJSON(),
    })
}

export async function getCollectionDetails (
    request: express.Request,
    response: express.Response
) {
    const id = new ObjectId(z.string().nonempty().parse(request.params.id))
    const collectionClient = await new CollectionService(request.user!)
    const result = await collectionClient.getCollection(id, {
        expand: request.expand,
    })
    response.json({
        success: true,
        data: result,
    })
}

export async function deleteCollection (
    request: express.Request,
    response: express.Response
) {
    const id = new ObjectId(z.string().nonempty().parse(request.params.id))
    const result = await new CollectionService(request.user!).deleteCollection(id)
    response.json({
        success: true,
        data: result,
    })
}

export async function editCollection (
    request: express.Request,
    response: express.Response
) {
    const id = new ObjectId(z.string().nonempty().parse(request.params.id))
    const collection = await new CollectionService(request.user!).editCollection(id, {
        name: z.string().nonempty().optional().parse(request.body.name),
        tags: z.array(z.string().nonempty()).optional().parse(request.body.tags),
        description: z.string().nonempty().optional().parse(request.body.name),
    })
    response.json({
        success: true,
    })
}

export async function changeCollectionPublicVisibility (
    request: express.Request,
    response: express.Response
) {
    const id = new ObjectId(z.string().nonempty().parse(request.params.id))
    await new CollectionService(request.user!).changeCollectionPublicVisibility(
        id,
        z.boolean().parse(request.body.public)
    )
    response.json({
        success: true,
    })
}

export async function editCollectionThumbnail (
    request: express.Request, 
    response: express.Response
) {
    const collectionId = new ObjectId(z.string().nonempty().parse(request.params.id))
    if (!request.file) {
        throw new FileMissingError()
    }
    await new CollectionService(request.user!).editCollectionThumbnail(collectionId, request.file)
    response.json({
        success: true,
    })
}

export async function editCollectionIcon (request: express.Request, response: express.Response) {
    const collectionId = new ObjectId(z.string().nonempty().parse(request.params.id))
    if (!request.file) {
        throw new FileMissingError()
    }
    await new CollectionService(request.user!).editCollectionIcon(collectionId, request.file)
    response.json({
        success: true,
    })
}
