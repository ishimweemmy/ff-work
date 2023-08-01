import express from 'express'
import * as annotationController from './controllers'
import { checkAuthorized } from '@/middlewares/auth'


const router = express.Router();

router.use(checkAuthorized)
router.get("/:id", annotationController.getAnnotationById);
router.put("/:id", annotationController.editAnnotation);
router.delete("/:id", annotationController.removeAnnotationBox);

export default router;
