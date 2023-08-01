import AbstractService from "@/utils/artifacts/AbstractService";
import CollectionRepository from "./repository";
import { ObjectId } from "@/utils/abbreviations";
import mongoose from "mongoose";
import { ICollection } from "./model";

export default class CollectionService extends AbstractService {
    repo = new CollectionRepository();

    async getCollection (
        id: ObjectId,
        query: {
            expand: string[]
        }
    ) {
        const collection = await this.repo.getCollectionById(id);

        this.repo.requestCollectionPermission(collection, this.user);
        return (await this.repo.expandCollectionObjects([collection], query.expand))![0];
    }


    async deleteCollection(id: ObjectId) {
        const collection = await this.repo.getCollectionById(id);

        this.repo.requestCollectionPermission(collection, this.user);
        await this.repo.removeCollection(collection);
    } 

    async searchCollections(query: {
        name?: string;
        sort?: string;
        expand: string[];
        pagination?: {
            greaterThan?: mongoose.Types.ObjectId;
            lessThan?: mongoose.Types.ObjectId;
            limit?: number;
        };
    }) {
        const queryResult = await this.repo.searchCollection({
            ...query,
            user: this.user._id,
        });
        const result = await this.repo.expandCollectionObjects(
            queryResult.data,
            query.expand,
        );
        return {
            ...queryResult,
            data: result,
        }
    }

    async getCollections(query: {
        expand: string[];
        pagination?: Express.RequestPagination;
    }) {
        const queryResult = await this.repo.getCollection({
            ...query,
            user: this.user._id,
        });
        const result = await this.repo.expandCollectionObjects(queryResult.data, query.expand);
        return {
            ...queryResult,
            data: result,
        }
    }

    async createCollection(collectionInfo: Partial<ICollection>) {
        return await this.repo.createCollection(
            {
                ...collectionInfo,
                user: this.user._id
            }
        );
    }

    async changeCollectionPublicVisibility (id: ObjectId, publiclyVisible: boolean) {
        const collection = await this.repo.getCollectionById(id)
        this.repo.requestCollectionPermission(collection, this.user)
        await this.repo.changeCollectionPublicVisibility(collection, publiclyVisible)
        await this.repo.updateCollection(collection)
    }

    async editCollection(
        id: ObjectId,
        params: {
            name?: string;
            tags?: string[];
            description?: string;
        }
    ) {
        const collection = await this.repo.getCollectionById(id);

        this.repo.requestCollectionPermission(collection, this.user);
        await this.repo.editCollectionParams(collection, params);
        await this.repo.updateCollection(collection);
    }

    async editCollectionIcon(
        id: ObjectId,
        icon: Express.Multer.File
    ) {
        const collection = await this.repo.getCollectionById(id);
        this.repo.verifyCollectionOwner(collection, this.user);
        await this.repo.editCollectionIcon(collection, icon)
        await this.repo.updateCollection(collection)
    }

    async editCollectionThumbnail(
        id: ObjectId,
        thumbnail: Express.Multer.File
    ) {
        const collection = await this.repo.getCollectionById(id);
        this.repo.verifyCollectionOwner(collection, this.user);
        await this.repo.editCollectionIcon(collection, thumbnail)
        await this.repo.updateCollection(collection)
    }
}