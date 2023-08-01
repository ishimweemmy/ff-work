import express from 'express'
import * as datasetPermissionController from '@/domains/datasets/permissions/controllers'

const router = express.Router()

router.get('/:id', datasetPermissionController.getDatasetPermissionById)
router.patch('/:id', datasetPermissionController.editDatasetPermissionById)
router.delete('/:id', datasetPermissionController.revokeDatasetPermissionById)

export default router;
