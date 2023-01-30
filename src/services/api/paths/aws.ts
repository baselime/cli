import { publicClient } from "../clients";

interface awsConnect {
  workspaceId: string;
  token: string;
  account: string;
  region: string;
  alias: string;
}

async function awsConnect(params: awsConnect): Promise<{ url: string }> {
  const res = (
    await publicClient.put("/aws/connect", params, {
      headers: {
        authorization: `Bearer ${params.token}`,
      },
    })
  ).data;
  return res;
}

export default {
  awsConnect,
};
