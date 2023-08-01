import { IUser } from './domains/users/models/UserModel'
import mongoose, { HydratedDocument } from 'mongoose'
import '@/typings/mongo-cursor-pagination'
import { _SupportedAssetType } from '@/domains/assets/enums'
import { _AssetStage } from '@/domains/assets/enums'
import { _DatasetLicense } from '@/domains/datasets/enums'

declare global {
  namespace Express {
    interface User extends HydratedDocument<IUser> {
      _id: mongoose.Types.ObjectId;
    }

    interface Request {
      expand: string[];
      sort: RequestSort;
      pagination: RequestPagination;
    }

    interface RequestPagination {
      limit?: number;
      previous?: string;
      next?: string;
    }

    interface RequestSort<T extends Record<string, any> = Record<string, any>> {
      field?: keyof T;
      relevancePeriod?: Date;
      ascending?: boolean;
    }
  }

  namespace Flockfysh {
    type SupportedAssetType = _SupportedAssetType;
    type AssetStage = _AssetStage;
    type DatasetLicense = _DatasetLicense;
  }
}

export {}
