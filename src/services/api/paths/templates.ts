import { DeploymentResources } from "../../../commands/apply/handlers/checks";
import { client, publicClient } from "../clients";
import yaml, { Document } from "yaml";


export interface Template {
  workspaceId: string;
  name: string;
  description?: string;
  public: boolean;
  variables: Variable[];
  resources: DeploymentResources;
  userId: string;
  created?: string;
  updated?: string;
}

export interface Variable {
  ref: string;
  description?: string;
  default?: any;
}

async function templatesList(): Promise<Template[]> {
  const res = (await client.get("/templates")).data;
  return res.templates;
}

async function templateGet(workspaceId: string, template: string, isPublic: boolean = false): Promise<Template> {
  const res = (await client.get(`/templates/${workspaceId}/${template}`, { params: { public: isPublic } })).data;
  return res.template;
}

export default {
  templatesList,
  templateGet,
};
