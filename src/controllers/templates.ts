import api from "../services/api/api";
import { mkdirSync, rmdirSync, writeFileSync } from "fs";
import spinner from "../services/spinner";
import { InferType, lazy, object, string } from "yup";
import { mapValues } from "lodash";
import { variableSchema } from "../commands/push/handlers/validators";
import {
  parseAndAppendFileToResources,
  readResourcesFromFile,
} from "../services/parser/parser";

export const templateSchema = object({
  name: string().required(),
  variables: lazy(obj => object(
      mapValues(obj, () => variableSchema)
  )).optional()
}).optional();

export async function stepTemplates(outputPath: string, resources: Record<string, any>, templates: InferType<typeof templateSchema>[], serviceId: string) {
  const templatesDir = `${outputPath}/.templates`;
  rmdirSync(templatesDir, {
    recursive: true
  });
  for await(let template of templates) {
    await handleTemplate(template, templatesDir, serviceId, resources);
  }
}

async function handleTemplate(template: InferType<typeof templateSchema>, outputPath: string, serviceId: string, resources: Record<string, any>) {
  const s = spinner.get();
  if(!template?.name) {
    throw new Error(`invalid template ${template}`);
  }
  const [workspaceId, templateName] = template.name.split("/");
  if (!(workspaceId && templateName)) {
    throw new Error(`invalid template ${template}`);
  }
  try {
    // Downloading
    const templateLocation = await downloadTemplate(outputPath, workspaceId, templateName, serviceId);
    // Parsing
    s.info(`Parsing the template ${template.name}`);
    const fileContents = await readResourcesFromFile(templateLocation);
    await parseAndAppendFileToResources(fileContents, resources, template?.variables);
    s.succeed(`Parsing the template ${template.name} complete!`);
  } catch (e) {
    spinner.get().fail(`Failed to download a template ${template.name}`);
    throw e;
  }
}

async function downloadTemplate(parentDir: string, workspaceId: string, templateName: string, serviceId: string): Promise<string> {
  const workspacePath = `${parentDir}/${workspaceId}`
  mkdirSync(workspacePath, {
    recursive: true
  });
  const templateFilePath = `${workspacePath}/${templateName}.yml`;
  const s = spinner.get();
  s.info(`Downloading template ${workspaceId}/${templateName}`);
  const templateData = await api.templateDownload(workspaceId, templateName, serviceId);
  const buf = Buffer.from(templateData.template);
  writeFileSync(templateFilePath, buf);
  s.succeed(`Downloading template ${workspaceId}/${templateName} complete!`);
  return templateFilePath;
}
