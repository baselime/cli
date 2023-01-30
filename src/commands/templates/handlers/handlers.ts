import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import pushHandlers from "../../push/handlers/handlers";
import { cloneRepo, uploadExtraAssets } from "./fsHelper";
import { Template } from "../../../services/api/paths/templates";
import fs from "fs/promises";
import path from "path";

async function publish(path?: string, url?: string, recurse = false) {
  const s = spinner.get();
  if (!(path || url)) {
    s.fail("must provide either --path or --url");
    return;
  }
  let template: Template;
  // If user provides URL, we override "path" with location where data got cloned from the URL
  if (url) {
    path = await cloneRepo(url);
  }
  if (!path) {
    s.fail(`Please ensure you have read/write permissions to the path ${path}`);
    return;
  }

  let templateDirs = [path];

  if (recurse) {
    templateDirs = await findIndexYamlDirs(path);
  }

  const promises = templateDirs.map(async (templateDir) => {
    const template = await createTemplateFromFile(templateDir);
    await uploadExtraAssets(templateDir!, template.workspaceId, template.name);
    return template;
  });
  const templates = await Promise.all(promises);
  outputs.list(templates, "json");
}

async function findIndexYamlDirs(dir: string): Promise<string[]> {
  let paths = [];
  const dirContents = await fs.readdir(dir);
  for (let content of dirContents) {
    const thingy = path.join(dir, content);
    const stat = await fs.lstat(thingy);
    if (stat.isDirectory()) {
      const indexFiles = await findIndexYamlDirs(thingy);
      paths.push(...indexFiles);
    } else {
      const file = path.parse(thingy);
      if (file.base === "index.yml") {
        paths.push(file.dir);
      }
    }
  }
  return paths;
}
async function createTemplateFromFile(path: string): Promise<Template> {
  const s = spinner.get();
  const { metadata, template: t } = await pushHandlers.validate(path);

  const template = await api.templateCreate({
    name: metadata.service,
    description: metadata.description,
    variables: metadata.variables as any,
    template: t,
    public: true,
  });
  return template;
}

async function list() {
  const s = spinner.get();
  s.start("Fetching the templates");
  const templates = await api.templatesList();
  s.succeed();
  outputs.list(templates, "json");
}

async function get(workspaceId: string, name: string) {
  const s = spinner.get();
  s.start("Fetching the template");
  const template = await api.templateGet(workspaceId, name);
  s.succeed();
  outputs.get(template, "json");
}

export default {
  publish,
  list,
  get,
};
