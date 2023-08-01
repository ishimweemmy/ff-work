import * as config from '@/utils/config'
import { JSONRPCClient } from 'json-rpc-2.0'
import axios from 'axios'
import { IUser } from '@/domains/users/models/UserModel'

export const rpcBillingMicroserviceClient: JSONRPCClient<{
  user?: IUser;
}> = new JSONRPCClient(async (payload, clientParams={}) => {
  const data = (await axios.post(new URL('/json-rpc', config.BILLING_MICROSERVICE_URL).toString(), payload, {
    headers: {
      user: clientParams.user?._id.toString(),
      Authorization: 'Bearer something_here',
    }
  })).data
  return rpcBillingMicroserviceClient.receive(data)
})
