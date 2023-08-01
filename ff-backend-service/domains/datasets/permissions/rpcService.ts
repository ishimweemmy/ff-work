import DatasetRepository from '@/domains/datasets/repository'
import { ObjectId } from '@/utils/abbreviations'
import UserRepository from '@/domains/users/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import { DatasetRole } from '@/domains/datasets/permissions/model'

const datasetRepo = new DatasetRepository();
const userRepo = new UserRepository();
const repo = new DatasetPermissionRepository();

export default function rpcDatasetPermissionService(server: RpcServer) {
  server.addMethod("datasetPermissions:grant", async (params: {
    purchased?: boolean,
    user: string
    dataset: string,
    role?: DatasetRole
  }) => {
    if (!params.dataset) {
      throw new Error("Missing dataset ID.");
    }
    if (!params.user) {
      throw new Error("Missing dataset ID.");
    }
    const user = await userRepo.findUserById(new ObjectId(params.user))
    const dataset = await datasetRepo.getDatasetById(new ObjectId(params.dataset))
    return await repo.assignPermission(dataset, user, params.role ?? 'contributor', {
      purchased: params.purchased
    });
  })
}
