import { Collection, ObjectId } from 'mongodb';
import {
  MongoCursorPaginationParams,
  MongoCursorPaginationResult,
} from 'mongo-cursor-pagination';

async function paginateAggregate<T extends {}>(
  collection: Collection,
  pipeline: any[],
  options: MongoCursorPaginationParams<T>
): Promise<MongoCursorPaginationResult<T>> {
  const { limit, next, previous } = options;

  // Modify pipeline to include pagination stages
  const paginatedPipeline = [
    ...pipeline,
    { $skip: next ? parseInt(next, 10) : 0 },
    { $limit: limit },
  ];

  const [results, countResult] = await Promise.all([
    collection.aggregate(paginatedPipeline).toArray(),
    collection.aggregate([...pipeline, { $count: 'total' }]).toArray(),
  ]);

  const total = countResult[0]?.total || 0;
  const hasNext = results.length > limit;
  const hasPrevious = !!previous;

  // Adjust results based on pagination
  const paginatedResults = results.slice(0, limit) as Array<
    { _id: ObjectId } & T
  >;

  return {
    results: paginatedResults,
    previous: hasPrevious ? previous : undefined,
    next: hasNext ? String(limit) : undefined,
    hasPrevious,
    hasNext,
    total,
  };
}

export { paginateAggregate };
