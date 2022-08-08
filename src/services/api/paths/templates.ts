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

async function templateGetPublic(workspaceId: string, template: string): Promise<Template> {
  const res = (await publicClient.get(`/templates/public/${workspaceId}/${template}`)).data;
  return res.template;
}

export default {
  templatesList,
  templateGetPublic,
};
