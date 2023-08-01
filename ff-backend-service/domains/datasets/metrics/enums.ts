import { z } from 'zod'

export const ACTIVITY_TYPE_ENUM = z.enum(['view', 'download'])
export type _ActivityType = z.infer<typeof ACTIVITY_TYPE_ENUM>