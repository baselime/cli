import { client } from "../clients";


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
    [stage: string]: string | number | boolean | undefined;
  } | undefined
}

export interface TemplateCreateParams {
  name: string;
  description?: string;
  public: boolean;
  variables?: TemplateVariables;
  template: string;
}

export interface TemplateUploadURLResponse {
  readmeURL: string;
  licenseURL: string;
}

async function templatesList(): Promise<Template[]> {
  const res = (await client.get("/templates")).data;
  return res.templates;
}

async function templateGet(workspaceId: string, templateName: string, isPublic: boolean = false): Promise<Template> {
  const res = (await client.get(`/templates/${workspaceId}/${templateName}`, { params: { public: isPublic } })).data;
  return res.template;
}

async function templateCreate(template: TemplateCreateParams): Promise<Template> {
  const res = (await client.post(`/templates`, template, { timeout: 30000 })).data;
  return res.template;
}

async function templateGetUploadUrl(workspaceId: string, templateName: string): Promise<TemplateUploadURLResponse> {
  return (await client.get(`/templates/${workspaceId}/${templateName}/upload-url`, { params: { public: false } })).data;
}

export default {
  templatesList,
  templateGet,
  templateCreate,
  templateGetUploadUrl
};
