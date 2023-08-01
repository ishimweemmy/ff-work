declare module 'mongo-cursor-pagination' {
  import mongoose from 'mongoose';
  import mongodb from 'mongodb';

  interface MongoCursorPaginationConfig {
    MAX_LIMIT: number;
    DEFAULT_LIMIT: number;
  }

  const config: MongoCursorPaginationConfig;

  export interface MongoCursorPaginationParams<
    Schema extends {},
    FindQuery = mongoose.FilterQuery<Schema>
  > {
    query: FindQuery;
    limit: number;
    fields?: Partial<Record<keyof Schema, number>>;
    paginatedField?: keyof Schema;
    sortAscending?: boolean;
    sortCaseInsensitive?: boolean;
    next?: string;
    previous?: string;
    after?: string;
    before?: string;
    hint?: string;
    collation?: mongodb.CollationOptions;
  }

  export interface MongoCursorPaginationAggregationParams {
    aggregation: mongoose.PipelineStage[],
    limit: number,
    paginatedField?: string,
    sortAscending?: boolean,
    sortCaseInsensitive?: boolean,
    next?: string,
    previous?: string,
    after?: string,
    before?: string,
    hint?: string,
    collation?: mongodb.CollationOptions,
  }

  export interface MongoCursorPaginationMeta {
    previous?: string;
    next?: string;
    hasPrevious: boolean;
    hasNext: boolean;
  }

  export interface MongoCursorPaginationResult<Schema extends {}>
    extends MongoCursorPaginationMeta {
    results: ({ _id: mongodb.ObjectId } & Schema)[];
    total: number;
  }

  export function find<
    Schema extends {},
    FindQuery extends mongoose.Query<any, any>
  >(
    collection: mongodb.Collection | mongoose.Collection,
    params: MongoCursorPaginationParams
  ): Promise<MongoCursorPaginationResult<Schema>>;

  export function aggregate<OutputSchema>(collection: mongodb.Collection | mongoose.Collection, params: MongoCursorPaginationAggregationParams):
    Promise<MongoCursorPaginationResult<OutputSchema>>

  // statics
  export interface MongooseCursorPaginationModel<
    T,
    TQueryHelpers = {},
    TMethodsAndOverrides = {},
    TVirtuals = {},
    TSchema = any
  > extends mongoose.Model<
      T,
      TQueryHelpers,
      TMethodsAndOverrides,
      TVirtuals,
      TSchema
    > {
    paginate<Output = T>(
      params: MongoCursorPaginationParams<T>
    ): Promise<MongoCursorPaginationResult<Output>>;
  }

  function mongoosePlugin<T>(schema: mongoose.Schema<T>): void;

  const MongoPaging: {
    mongoosePlugin: typeof mongoosePlugin;
  };

  export default MongoPaging;
}
