import { client, getTuxUrl } from "../clients";

async function explain(message: string): Promise<string> {
  const res = (await client.post(`${getTuxUrl()}/explain/api`, { message }, { timeout: 120000 })).data;
  return res.answer;
}

export default {
  explain,
};
