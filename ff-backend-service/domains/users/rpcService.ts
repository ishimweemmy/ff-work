import { ObjectId } from '@/utils/abbreviations'
import UserRepository from '@/domains/users/repository'

const repo = new UserRepository();

export default function rpcUserService(server: RpcServer) {
  server.addMethod("users:get", async (params: {
    id: string
  }, serverParams) => {
    if (!params.id) {
      throw new Error("Missing dataset ID.");
    }
    return await repo.findUserById(new ObjectId(params.id));
  })
}
