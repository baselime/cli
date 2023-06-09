import {client} from "../clients";

type RehydrateParams = {
  startDate: Date;
  hoursToRecover: number;
  accountId: string;
  region: string
}

async function rehydrate(params: RehydrateParams): Promise<boolean> {
  return (await client.post(`/rehydrate`, {
    ...params
  })).data;
}

export default {
  rehydrate
}