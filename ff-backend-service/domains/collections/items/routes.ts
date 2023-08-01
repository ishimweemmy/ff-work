import express from 'express'
import * as controller from './controllers';

export const nestedCollectionItemRouter = express.Router()

nestedCollectionItemRouter.get("/", controller.searchDatasets);
nestedCollectionItemRouter.post('/', controller.addDataset);
nestedCollectionItemRouter.delete("/", controller.deleteDataset);
