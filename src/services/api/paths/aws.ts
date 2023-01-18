import { publicClient } from "../clients";

interface awsConnect {
  otp: string;
  account: string;
  region: string;
  alias: string;
}

async function awsConnect(params: awsConnect): Promise<{ url: string }> {
  const res = (await publicClient.put("/aws/connect", params)).data;
  return res;
}

export default {
  awsConnect,
};
