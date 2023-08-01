import express from 'express'
import * as controller from '../controllers'

const router = express.Router()
router.get("/:id", controller.getDatasetAsset);

export default router
