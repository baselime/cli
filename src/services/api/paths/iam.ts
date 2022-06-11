import { client } from "../clients";

export interface User {
  email: string;
}

async function iamGet(): Promise<User> {
  try {

    const res = (await client.get("/iam",)).data;
    return res.user;
  } catch(error) {
    console.log(error);
    throw error;
  }
}

export default {
  iamGet,
};
