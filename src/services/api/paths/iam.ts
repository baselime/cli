import { client } from "../clients";

export interface User {
  email: string;
}

async function iamGet(): Promise<User> {
  const res = (await client.get("/iam")).data;
  return res.user;
}

export default {
  iamGet,
};
