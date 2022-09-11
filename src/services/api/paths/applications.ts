import { client } from "../clients";

export interface Application {
  workspaceId: string;
  environmentId: string;
  userId: string;
  name: string;
  metadata: {
    description?: string;
    provider: string;
    version: string;
    infrastructure?: {
      functions?: string[];
    }
  };
  created?: string;
  updated?: string;
}

async function applicationsList(): Promise<Application[]> {
  const res = (await client.get("/applications")).data;
  return res.applications;
}

async function applicationGet(name: string): Promise<Application> {
  const res = (await client.get(`/applications/${name}`)).data;
  return res.application;
}

async function applicationDelete(name: string): Promise<Application> {
  const res = (await client.delete(`/applications/${name}`)).data;
  return res.application;
}

export default {
  applicationsList,
  applicationGet,
  applicationDelete,
};
