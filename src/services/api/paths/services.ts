import { client } from "../clients";

export interface Service {
  workspaceId: string;
  environmentId: string;
  userId: string;
  name: string;
  metadata: {
    description?: string;
    provider: string;
    version: string;
    infrastructure?: {
      stacks?: string[];
    };
  };
  created?: string;
  updated?: string;
}

async function servicesList(): Promise<Service[]> {
  const res = (await client.get("/services")).data;
  return res.services;
}

async function serviceGet(name: string): Promise<Service> {
  const res = (await client.get(`/services/${name}`)).data;
  return res.service;
}

async function serviceDelete(name: string): Promise<Service> {
  const res = (await client.delete(`/services/${name}`)).data;
  return res.service;
}

export default {
  servicesList,
  serviceGet,
  serviceDelete,
};
