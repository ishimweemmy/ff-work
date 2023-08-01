import { z } from 'zod'

export const SUPPORTED_ASSET_TYPE_ENUM = z.enum(['image', 'video', 'text', 'other'])
export type _SupportedAssetType = z.infer<typeof SUPPORTED_ASSET_TYPE_ENUM>;

export const ASSET_STAGE_ENUM = z.enum(['completed', 'feedback', 'uploaded'])
export type _AssetStage = z.infer<typeof ASSET_STAGE_ENUM>
