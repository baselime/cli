import {client} from "../clients";

export interface Account {
  id: string;
  region: string;
}
export interface Environment {
  accounts: Account[];
  id: string;
  workspaceId: string;
}

async function getEnvironment(): Promise<Environment> {
  return (await client.get(`/environments`)).data.environment;
}

export default {
  getEnvironment
}