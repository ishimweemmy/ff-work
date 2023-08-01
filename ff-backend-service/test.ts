import '@/utils/config';
import { rpcBillingMicroserviceClient } from '@/utils/rpc/rpcClient'
import { ObjectId } from '@/utils/abbreviations'
import { IUser } from '@/domains/users/models/UserModel'

rpcBillingMicroserviceClient.request("billingAccounts:ensure", {
  param: 1,
}, {
  user: {
    _id: new ObjectId()
  } as IUser
}).then();
