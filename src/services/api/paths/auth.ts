import { client, publicClient } from "../clients";

export interface APIKey {
  userId: string;
  environmentId: string;
  workspaceId: string;
  permissions: KeyPermissions
  created: string;
  updated: string;
}
export interface Workspace {
  id: string;
  name: string;
  environments: Environment[];
  subscription: {
    tier: number;
    start: number;
    isActive: boolean;
  };
  updated: string;
  created: string;
}

export interface Environment {
  alias: string;
  id: string;
  region: string;
  account: string;
}


export interface KeyPermissions {
  events: boolean;
  queries: boolean;
  alerts: boolean;
  defects: boolean;
  applications: boolean;
  environments: boolean;
}

async function generateOneTimePassword(email: string) {
  await publicClient.post("/auth/otp", { email });
}

async function getWorkspacesByOneTimePassword(
  otp: string,
): Promise<Workspace[]> {
  const { workspaces } = (
    await publicClient.get("/auth/workspaces", { params: { otp } })
  ).data;
  return workspaces;
}

async function getApiKey(
  workspaceId: string,
  environmentId: string,
  otp: string,
): Promise<string> {
  const { apiKey } = (
    await publicClient.get("/auth/api-key", {
      params: { otp, environmentId, workspaceId },
    })
  ).data;
  return apiKey;
}

async function getApiKeyPermissions(): Promise<{ key: APIKey; workspace: Workspace; environment: Environment }> {
  const { key, workspace, environment } = (await client.get("auth")).data
  return { key, workspace, environment };
}

export default {
  generateOneTimePassword,
  getWorkspacesByOneTimePassword,
  getApiKey,
  getApiKeyPermissions,
};
