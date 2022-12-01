import { writeFileSync } from "fs";
import api from "../../services/api/api";
import { Ref, stringify, stringifyResources } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import { parseTemplateName } from "../../regex";
import { promptTemplateVariables } from "../applications/handlers/prompts";
import { DeploymentApplication } from "../push/handlers/checks";
import { promptStacksSelect } from "./prompts";
const packageJson = require("../../../package.json");


export async function init(
  folder: string,
  application: string,
  description: string,
  provider: string,
  templateUrl?: string,
) {
  const s = spinner.get();

  const stacks = await promptStacksSelect(provider);
  
  
  s.start("Generating your config folder");

  const metadata: DeploymentApplication = {
    version: packageJson.version,
    application,
    description: description || undefined,
    provider,
    infrastructure: {
      stacks,
    }
  };

  if (Object.values(metadata.infrastructure || {}).every(v => v === undefined || v.length === 0)) {
    // @ts-expect-error it should work
    metadata.infrastructure = undefined;
  }

  const d = stringify(metadata);
  writeFileSync(`${folder}/index.yml`, d);


  if (templateUrl) {
    const { workspaceId, template: templateName } = parseTemplateName(templateUrl);
    const template = await api.templateGet(workspaceId, templateName, true);
    const { resources, variables } = template;
    let data = stringifyResources(resources);
    if (variables?.length) {
      const vars: Record<string, any> = await promptTemplateVariables(variables);
      variables.forEach(variable => {
        const { ref } = variable;
        const value = vars[ref] || variable.default;
        if (!value) {
          s.fail(`Please provide a value for all variables: ${variable.ref} is missing and doesn't have a default value`);
          return;
        }
        data = data.split(`<var>${ref}</var>`).join(value);
      })
    }

    writeFileSync(`${folder}/${application}.yml`, data);
    s.succeed();
    return;
  }
  s.succeed();
}