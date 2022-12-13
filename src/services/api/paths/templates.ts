import { client } from "../clients";

export interface Template {
  workspaceId: string;
  name: string;
  description?: string;
  public: boolean;
  variables?: Record<string, TemplateVariable>;
  template: string;
  userId: string;
  created?: string;
  updated?: string;
  downloadCounter: number
}

export interface TemplateVariable {
  description?: string;
  [stage: string]: string | number | boolean | undefined;
}

export interface TemplateCreateParams {
  name: string;
  description?: string;
  public: boolean;
  variables?: Record<string, TemplateVariable>;
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

async function templateDownload(workspaceId: string, templateName: string, serviceId: string): Promise<Template> {
  return (await client.post(`/templates/${workspaceId}/${templateName}/download`, { serviceId })).data.template;
}

export default {
  templatesList,
  templateGet,
  templateCreate,
  templateGetUploadUrl,
  templateDownload,
};
