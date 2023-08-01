import { JSONRPCServer } from 'json-rpc-2.0'
import rpcDatasetService from '@/domains/datasets/rpcService'
import rpcUserService from '@/domains/users/rpcService'
import rpcDatasetPermissionService from '@/domains/datasets/permissions/rpcService'

export interface ServerParameters {}

const rpcServer = new JSONRPCServer<ServerParameters>()
rpcDatasetService(rpcServer)
rpcUserService(rpcServer)
rpcDatasetPermissionService(rpcServer);

export default rpcServer
