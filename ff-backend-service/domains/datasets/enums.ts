import z from 'zod'

export const DATASET_LICENSE_ENUM = z.enum([
  'none',
  'cc0-4.0',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc-by-nc-4.0',
  'cc-by-nc-sa-4.0',
  'cc-by-nd-4.0',
  'cc-by-nc-nd-4.0',
]);
export type _DatasetLicense = z.infer<typeof DATASET_LICENSE_ENUM>;
