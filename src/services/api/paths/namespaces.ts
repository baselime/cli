import { stringify } from "qs";
import { client } from "../clients";

async function namespacesList(from: number, to: number, service?: string): Promise<{ namespace: string; timestamp: string }[]> {
  const res = (await client.get(`/namespaces/?${stringify({ service, from, to })}`)).data;
  return res.namespaces;
}

export default {
  namespacesList,
};
