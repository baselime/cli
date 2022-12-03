import { client, publicClient } from "../clients";

export interface Deployment {
  id: string;
  service: string;
  workspaceId: string;
  environmentId: string;
  userId: string;
  error?: string;
  status: DeploymentStatus
  created?: string;
  updated?: string;
}

export enum DeploymentStatus {
  IN_PROGRESS = "IN_PROGRESS",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}


async function upload(preSignedUrl: string, data: string | Buffer) {
  await publicClient.put(preSignedUrl, data, {
    headers: {
      "content-Type": "application/json",
    },
  });
}

async function uploadUrlGet(
  service: string,
  version: string,
): Promise<{ url: string; id: string }> {
  const res = (
    await client.put("/deployments/upload-url", { service, version })
  ).data;
  return res;
}

async function deploymentGet(service: string, id: string,): Promise<Deployment> {
  const res = (
    await client.get(`/deployments/${service}/${id}`)
  ).data;
  return res.deployment;
}

async function deploymentsList(service: string, limit?: number): Promise<Deployment[]> {
  const res = (
    await client.get(`/deployments/${service}`, { params: { limit } })
  ).data;
  return res.deployments;
}

export default {
  uploadUrlGet,
  upload,
  deploymentGet,
  deploymentsList,
};
