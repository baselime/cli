import fs, { writeFileSync } from "fs";
import api from "../../services/api/api";
import { stringify } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import { parseTemplateName } from "../../regex";
import { DeploymentService } from "../push/handlers/validators";
const packageJson = require("../../../package.json");

export async function init(folder: string, service: string, description: string, provider: string, templateUrls?: string[]) {
  const s = spinner.get();

  await fs.mkdirSync(".baselime/.templates", { recursive: true });

  s.start("Generating your config folder");

  let templates: any[] = [];
  if (templateUrls) {
    for await (const templateUrl of templateUrls) {
      const { workspaceId, template: templateName } = parseTemplateName(templateUrl);
      const { variables, template } = await api.templateGet(workspaceId, templateName, true);
      console.log("got template", template);
      templates.push({ name: `${workspaceId}/${templateName}`, variables });
    }
  }

  const metadata: DeploymentService = {
    version: packageJson.version,
    service,
    description: description || undefined,
    provider,
    templates: templates as any,
  };

  if (Object.values(metadata.infrastructure || {}).every((v) => v === undefined || v?.length === 0)) {
    metadata.infrastructure = undefined;
  }

  const d = stringify(metadata);
  writeFileSync(`${folder}/index.yml`, d);

  s.succeed();
}
