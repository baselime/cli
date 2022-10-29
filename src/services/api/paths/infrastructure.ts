import { client } from "../clients";

export interface LambdaFunction {
  name: string;
  type: "lambda",
}

export interface CloudFormationStack {
  name: string;
  type: "cloudformation",
}

async function stacksList(provider: string): Promise<CloudFormationStack[]> {
  const res = (await client.get(`/infrastructure/${provider}/stacks`)).data;
  return res.stacks;
}

export default {
  stacksList,
};
