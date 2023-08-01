import express from 'express'
import { checkAuthorized } from '@/middlewares/auth'
import * as LabelController from '@/domains/labels/controllers'

const router = express.Router()

router.use(checkAuthorized)
router.get('/:id', LabelController.getLabelById)
router.delete('/:id', LabelController.deleteLabel)
router.patch('/:id/name', LabelController.renameLabel)
router.patch('/:id/tool', LabelController.changeToolOfLabel)
router.patch('/:id/color', LabelController.changeColorOfLabel)

export default router;
