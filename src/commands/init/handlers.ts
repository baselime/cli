import { writeFileSync } from "fs";
import api from "../../services/api/api";
import { stringify } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import { parseTemplateName } from "../../regex";
import { DeploymentService } from "../push/handlers/validators";
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


  let templates;
  if (templateUrl) {
    const { workspaceId, template: templateName } = parseTemplateName(templateUrl);
    const { variables } = await api.templateGet(workspaceId, templateName, true);;
    templates = [{ name: `${workspaceId}/${templateName}`, variables }];
  }


  const metadata: DeploymentService = {
    version: packageJson.version,
    service,
    description: description || undefined,
    provider,
    infrastructure: {
      stacks,
    },
    templates: templates as any,
  };

  if (Object.values(metadata.infrastructure || {}).every(v => v === undefined || v?.length === 0)) {
    metadata.infrastructure = undefined;
  }

  const d = stringify(metadata);
  writeFileSync(`${folder}/index.yml`, d);

  s.succeed();
}