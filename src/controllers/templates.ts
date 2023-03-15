import api from "../services/api/api";
import {mkdirSync, rmdirSync, rmSync, writeFileSync} from "fs";
import spinner from "../services/spinner";
import { InferType, lazy, object, string } from "yup";
import { mapValues } from "lodash";
import { variableSchema } from "../commands/push/handlers/validators";
import {appendToResourcesSafely, readResourcesFromFile} from "../services/parser/parser";

export const templateSchema = object({
  name: string().required(),
  variables: lazy((obj) => object(mapValues(obj, () => variableSchema))).optional(),
}).optional();

export async function stepTemplates(
    outputPath: string,
    resources: Record<string, any>,
    templates: InferType<typeof templateSchema>[],
    serviceId: string,
    shouldRedownload: boolean
) {
  const templatesDir = `${outputPath}/.templates`;
  const s = spinner.get();
  s.info(`Loading templates: ${templates.length}`);
  for await (let template of templates) {
    const s = spinner.get();
    if (!template?.name) {
      throw new Error(`invalid template ${JSON.stringify(template)}: missing name property.`);
    }
    const [workspaceId, templateName] = template.name.split("/");
    if (!(workspaceId && templateName)) {
      throw new Error(`invalid template ${JSON.stringify(template)}: workspace ${workspaceId}, name: ${templateName}`);
    }
    try {
      const templateFilePath = `${templatesDir}/${workspaceId}/${templateName}.yml`;
      // Downloading
      if (shouldRedownload) {
        await downloadTemplate(templateFilePath, workspaceId, templateName, serviceId);
      }
      // Parsing
      s.info(`Parsing the template ${template.name}`);
      const fileContents = await readResourcesFromFile(templateFilePath, template?.variables);
      appendToResourcesSafely(resources, fileContents.resourceMap);
      s.succeed(`Parsing the template ${template.name} complete!`);
    } catch (e) {
      spinner.get().fail(`Failed to download a template ${template.name}`);
      throw e;
    }
  }
}

async function downloadTemplate(templateFilePath: string, workspaceId: string, templateName: string, serviceId: string): Promise<string> {
  try {
    await rmSync(templateFilePath);
  } catch(e) {
    // this is ok
  }
  const s = spinner.get();
  s.info(`Downloading template ${workspaceId}/${templateName}`);
  const templateData = await api.templateDownload(workspaceId, templateName, serviceId);
  const buf = Buffer.from(templateData.template);
  writeFileSync(templateFilePath, buf);
  s.succeed("Done!");
  return templateFilePath;
}
