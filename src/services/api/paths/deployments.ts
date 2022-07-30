import { client, publicClient } from "../clients";

export interface Deployment {
  id: string;
  application: string;
  workspaceId: string;
  environmentId: string;
  userId: string;
  status: DeploymentStatus
  created?: string;
  updated?: string;
}

export enum DeploymentStatus {
  IN_PROGRESS = "IN_PROGRESS",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}


async function uplaod(preSignedUrl: string, data: string | Buffer) {
  await publicClient.put(preSignedUrl, data, {
    headers: {
      "content-Type": "application/json",
    },
  });
}

async function uploadUrlGet(
  application: string,
  version: string,
): Promise<{ url: string; id: string }> {
  const res = (
    await client.put("/deployments/upload-url", { application, version })
  ).data;
  return res;
}

async function deploymentGet(application: string, id: string,): Promise<Deployment> {
  const res = (
    await client.get(`/deployments/${application}/${id}`)
  ).data;
  return res.deployment;
}

async function deploymentsList(application: string, limit?: number): Promise<Deployment[]> {
  const res = (
    await client.get(`/deployments/${application}`, { params: { limit } })
  ).data;
  return res.deployments;
}

export default {
  uploadUrlGet,
  uplaod,
  deploymentGet,
  deploymentsList,
};
