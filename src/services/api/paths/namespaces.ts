import { stringify } from "qs";
import { client } from "../clients";

async function namespacesList(datasets: string[], from: number, to: number): Promise<{ namespace: string; timestamp: string }[]> {
  const res = (await client.get(`/namespaces/?${stringify({ datasets, from, to })}`)).data;
  return res.namespaces;
}

export default {
  namespacesList,
};
