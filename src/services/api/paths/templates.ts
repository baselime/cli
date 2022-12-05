import { DeploymentResources } from "../../../commands/push/handlers/checks";
import { client, publicClient } from "../clients";
import yaml, { Document } from "yaml";


export interface Template {
  workspaceId: string;
  name: string;
  description?: string;
  public: boolean;
  variables: TemplateVariables;
  template: string;
  userId: string;
  created?: string;
  updated?: string;
}

export interface TemplateVariables {
  [name: string | number | symbol]: {
    description?: string;
    default?: string | number | boolean;
    value?: string | number | boolean;
  } | undefined | null
}

export interface TemplateCreateParams {
  name: string;
  description?: string;
  public: boolean;
  variables?: TemplateVariables;
  template: string;
}

async function templatesList(): Promise<Template[]> {
  const res = (await client.get("/templates")).data;
  return res.templates;
}

async function templateGet(workspaceId: string, template: string, isPublic: boolean = false): Promise<Template> {
  const res = (await client.get(`/templates/${workspaceId}/${template}`, { params: { public: isPublic } })).data;
  return res.template;
}

async function templateCreate(template: TemplateCreateParams): Promise<Template> {
  const res = (await client.post(`/templates`, template, { timeout: 30000 })).data;
  return res.template;
}

export default {
  templatesList,
  templateGet,
  templateCreate
};
