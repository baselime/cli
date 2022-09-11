import { client } from "../clients";

export interface LambdaFunction {
  name: string;
  type: "lambda",
  lastModified: string;
}


async function functionsList(provider: string): Promise<LambdaFunction[]> {
  const res = (await client.get(`/infrastructure/${provider}/functions`,)).data;
  return res.functions;
}

export default {
  functionsList,
};
