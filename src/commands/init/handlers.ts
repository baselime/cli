import { writeFileSync } from "fs";
import api from "../../services/api/api";
import { Ref, stringify, stringifyResources } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import { parseTemplateName } from "../../regex";
import { promptTemplateVariables } from "../services/handlers/prompts";
import { DeploymentService } from "../push/handlers/checks";
import { promptStacksSelect } from "./prompts";
const packageJson = require("../../../package.json");


export async function init(
  folder: string,
  service: string,
  description: string,
  provider: string,
  templateUrl?: string,
) {
  const s = spinner.get();

  const stacks = await promptStacksSelect(provider);
  
  
  s.start("Generating your config folder");

  const metadata: DeploymentService = {
    version: packageJson.version,
    service,
    description: description || undefined,
    provider,
    infrastructure: {
      stacks,
    }
  };

  if (Object.values(metadata.infrastructure || {}).every(v => v === undefined || v?.length === 0)) {
    metadata.infrastructure = undefined;
  }

  const d = stringify(metadata);
  writeFileSync(`${folder}/index.yml`, d);


  if (templateUrl) {
    const { workspaceId, template: templateName } = parseTemplateName(templateUrl);
    const template = await api.templateGet(workspaceId, templateName, true);
    const { resources } = template;
    let data = stringifyResources(resources);

    writeFileSync(`${folder}/${service}.yml`, data);
    s.succeed();
    return;
  }
  s.succeed();
}