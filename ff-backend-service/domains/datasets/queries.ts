import { ObjectId } from '@/utils/abbreviations'

export interface DatasetExposedSearchQuery {
  paid?: boolean;
  public?: boolean;
  recipe?: ObjectId;
  user?: ObjectId;
  name?: string;
  sort?: Express.RequestSort;
  expand: string[];
  pagination?: Express.RequestPagination;
}

export interface DatasetRepositorySearchQuery {
  paid?: boolean;
  public?: boolean;
  user?: ObjectId;
  recipe?: ObjectId;
  name?: string;
  sort?: Express.RequestSort;
  pagination?: Express.RequestPagination;
}
