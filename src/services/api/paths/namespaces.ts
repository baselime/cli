import { client } from "../clients";

async function namespacesList(dataset: string, from: number, to: number): Promise<{ namespace: string; timestamp: string }[]> {
  const res = (await client.get(`/namespaces`, { params: { dataset, from, to } })).data;
  return res.namespaces;
}

export default {
  namespacesList,
};
