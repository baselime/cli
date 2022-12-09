import api from "../services/api/api";
import { existsSync, writeFileSync } from "fs";
import spinner from "../services/spinner";

export async function downloadAndSaveTemplates(path: string, templates: string[], serviceId: string): Promise<string[]> {
  const filePaths = [];
  for await(let template of templates) {
    const [workspaceId, templateName] = template.split("/");
    if(!workspaceId || !templateName) {
      throw new Error(`invalid template ${template}`);
    }
    try {
      const templateFilePath = await downloadAndSaveTemplate(path, workspaceId, templateName, serviceId);
      if(templateFilePath) {
        filePaths.push(templateFilePath);
      }
    } catch (e) {
      spinner.get().fail(`failed to download a template ${template}`);
      throw e;
    }
  }
  return filePaths;
}

async function downloadAndSaveTemplate(path: string, workspaceId: string, templateName: string, serviceId: string): Promise<string | undefined> {
  const templateFilePath = `${path}/template_${workspaceId}_${templateName}.yml`;
  if(existsSync(templateFilePath)) {
    spinner.get().info(`Template ${workspaceId}/${templateName} already exists. Omitting download.`);
    return undefined
  }
  spinner.get().info(`Downloading template ${workspaceId}/${templateName}`);
  const templateData = await api.templateDownload(workspaceId, templateName, serviceId);
  const buf = Buffer.from(templateData.template);
  writeFileSync(templateFilePath, buf);
  return templateFilePath;
}