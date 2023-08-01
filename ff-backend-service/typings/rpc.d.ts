import { JSONRPCServer, JSONRPCServerMiddleware } from 'json-rpc-2.0'
import {ServerParameters} from "@/utils/rpc/rpcServer";

declare global {
    type RpcServer = JSONRPCServer<ServerParameters>
    namespace RpcServer {
        type Middleware = JSONRPCServerMiddleware<ServerParameters>
    }
}
