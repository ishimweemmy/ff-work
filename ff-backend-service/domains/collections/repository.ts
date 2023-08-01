import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { ObjectId } from '@/utils/abbreviations'
import Collection, { ICollection } from './model'
import { NotFoundError, PermissionError, UserMismatchError } from '@/utils/errors'
import mongoose, { HydratedDocument } from 'mongoose'
import { IUser } from '@/domains/users/models/UserModel'
import { deleteMany, getPublicUrl, getSignedUrlOfObject, upload } from '@/services/bucketService'
import { v4 } from 'uuid'

export default class CollectionRepository extends AbstractRepository {
  async getCollectionById (id: ObjectId) {
    const collection = await Collection.findById(id)
    if (!collection) throw new NotFoundError('Dataset collection not found')
    return collection
  }

  async createCollection (
    createParams: Partial<ICollection>
  ) {
    const collectionEntity = new Collection({
      ...createParams
    })
    await collectionEntity.validate()
    await collectionEntity.save()
    return collectionEntity
  }

  async searchCollection (query: {
    name?: string;
    user?: mongoose.Types.ObjectId;
    pagination?: Express.RequestPagination;
  }) {
    let limit = query.pagination?.limit ?? 10
    const internalQuery: {
      $text?: {
        $search: string;
      };
      user?: mongoose.Types.ObjectId;
    } = {}
    if (query.name) {
      internalQuery.$text = {
        $search: query.name,
      }
    }
    if (query.user) {
      internalQuery.user = query.user
    }
    const { results, ...meta } = await Collection.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    return {
      meta,
      data: results,
    }
  }

  async getCollection (query: {
    user?: mongoose.Types.ObjectId;
    pagination?: Express.RequestPagination;
  }) {
    let limit = query.pagination?.limit ?? 10
    const internalQuery: {
      user?: mongoose.Types.ObjectId;
    } = {}
    if (query.user) {
      internalQuery.user = query.user
    }
    const { results, ...meta } = await Collection.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    return {
      meta,
      data: results,
    }
  }

  verifyCollectionOwner<D extends ICollection, U extends IUser> (collection: D, user: U) {
    if (!collection.user.equals(user._id)) {
      throw new UserMismatchError('You do not own this collection.')
    }
  }

  requestCollectionPermission<D extends ICollection, U extends IUser> (collection: D, user: U) {
    try {
      this.verifyCollectionOwner(collection, user)
      return
    } catch (e) {
    }
    if (!collection.public) {
      throw new PermissionError('You do not have access to this collection.')
    }
  }

  async removeCollection (collection: HydratedDocument<ICollection>) {
    if (collection.thumbnail) {
      await deleteMany(undefined, [collection.thumbnail.assetKey.toString()])
    }
    if (collection.icon) {
      await deleteMany(undefined, [collection.icon.assetKey.toString()])
    }
    await collection.remove()
  }

  async editCollectionThumbnail (collection: HydratedDocument<ICollection>, file: Express.Multer.File) {
    if (collection.thumbnail) {
      await deleteMany(undefined, [collection.thumbnail.assetKey.toString()])
    }
    const newAssetKey = `collectionThumbnails/${v4()}`
    await upload(undefined, file.buffer, {
      fileName: newAssetKey,
      contentType: file.mimetype,
      ACL: 'public-read'
    })
    collection.thumbnail = {
      assetKey: newAssetKey,
      url: await getPublicUrl(undefined, newAssetKey),
    }
    await collection.save()
  }

  async editCollectionIcon (collection: HydratedDocument<ICollection>, file: Express.Multer.File) {
    if (collection.icon) {
      await deleteMany(undefined, [collection.icon.assetKey.toString()])
    }
    const newAssetKey = `collectionIcons/${v4()}`
    await upload(undefined, file.buffer, {
      fileName: newAssetKey.toString(),
      contentType: file.mimetype,
      ACL: 'public-read',
    })
    collection.thumbnail = {
      assetKey: newAssetKey,
      url: await getPublicUrl(undefined, newAssetKey),
    }
    await collection.save()
  }

  async changeCollectionPublicVisibility (collection: HydratedDocument<ICollection>, publiclyVisible: boolean) {
    collection.public = publiclyVisible
    await collection.save()
  }

  async editCollectionParams (
    collection: HydratedDocument<ICollection>,
    params: {
      name?: string;
      tags?: string[];
      description?: string;
    }
  ) {
    if (params.name) {
      collection.name = params.name
    }
    if (params.tags) {
      collection.tags = params.tags
    }
    if (params.description) {
      collection.description = params.description
    }
    await collection.save()
  }

  async updateCollection<T extends ICollection> (collection: T) {
    await Collection.updateOne(
      {
        _Id: collection._id,
      },
      {
        $set: {
          updatedAt: new Date(),
        },
      }
    )
  }

  async expandCollectionObjects<T extends ICollection> (
    collections: T[],
    expand: string[],
  ) {
    let result: (ICollection)[] = collections.map((item) => Collection.hydrate(item).toObject({
      depopulate: true,
    }))
    if (expand.includes('views')) {
      result = await Collection.populate(result, 'views')
    }
    if (expand.includes('user')) {
      result = await Collection.populate(result, 'user')
    }
    if (expand.includes('metrics')) {
      result = await Collection.populate(result, 'metrics')
    }
    return result
  }
}
