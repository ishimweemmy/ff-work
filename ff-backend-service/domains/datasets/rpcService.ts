import DatasetRepository from '@/domains/datasets/repository'
import { ObjectId } from '@/utils/abbreviations'

const repo = new DatasetRepository();

export default function rpcDatasetService(server: RpcServer) {
  server.addMethod("datasets:get", async (params: {
    id: string
  }, serverParams) => {
    if (!params.id) {
      throw new Error("Missing dataset ID.");
    }
    return await repo.getDatasetById(new ObjectId(params.id));
  })
}
