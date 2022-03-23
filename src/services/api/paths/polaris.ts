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


async function uplaod(preSignedUrl: string, data: string) {
  await publicClient.put(preSignedUrl, data, {
    headers: {
      "content-Type": "application/x-yaml",
    },
  });
}

async function getUploadUrl(
  application: string,
  version: string,
): Promise<{ url: string; id: string }> {
  const res = (
    await client.put("/polaris/upload-url", { application, version })
  ).data;
  return res;
}

async function getDeployment(application: string, id: string,): Promise<Deployment> {
  const res = (
    await client.get(`/polaris/deployments/${application}/${id}`)
  ).data;
  return res.deployment;
}

export default {
  getUploadUrl,
  uplaod,
  getDeployment,
};
