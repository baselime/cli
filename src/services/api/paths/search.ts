import { client } from "../clients";

type SearchParams = {
  query: string;
};

async function search(params: SearchParams): Promise<boolean> {
  return (
    await client.post("/search", {
      ...params,
    })
  ).data;
}

export default {
  search,
};
