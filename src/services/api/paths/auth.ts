import { client, publicClient } from "../clients";

export interface APIKey {
  userId: string;
  environmentId: string;
  workspaceId: string;
  permissions: KeyPermissions;
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
  id: string;
  region: string;
  account: string;
}

export interface KeyPermissions {
  events: boolean;
  queries: boolean;
  alerts: boolean;
  defects: boolean;
  services: boolean;
  environments: boolean;
}

async function getWorkspaces(accessToken?: string, otp?: string): Promise<Workspace[]> {
  const { workspaces } = (
    await publicClient.get("/auth/workspaces", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      params: { otp },
    })
  ).data;
  return workspaces;
}

async function createWorkspace(name: string, accessToken: string): Promise<Workspace> {
  const { workspace } = (
    await publicClient.post(
      "/auth/workspaces",
      { name, linkDomain: true },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    )
  ).data;
  return workspace;
}

async function getAuthIam(accessToken?: string, otp?: string) {
  const { user } = (
    await publicClient.get("/auth/iam", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      params: { otp },
    })
  ).data;
  return user;
}

async function getApiKey(workspaceId: string, environmentId: string, idToken?: string, otp?: string): Promise<string> {
  const { apiKey } = (
    await publicClient.get("/auth/api-key", {
      params: { otp, environmentId, workspaceId },
      headers: {
        ...(idToken && { authorization: `Bearer ${idToken}` }),
      },
    })
  ).data;
  return apiKey;
}

async function getApiKeyPermissions(): Promise<{ key: APIKey; workspace: Workspace; environment: Environment }> {
  const { key, workspace, environment } = (await client.get("auth")).data;
  return { key, workspace, environment };
}

async function getAuthConfig(): Promise<{ url: string; pool: string; client: string }> {
  const res = (await publicClient.get("/auth/config")).data;
  return res.config;
}

export default {
  getWorkspaces,
  getApiKey,
  getApiKeyPermissions,
  getAuthConfig,
  getAuthIam,
  createWorkspace,
};
