import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import pushHandlers from "../../push/handlers/handlers";
import { cloneRepo, uploadExtraAssets } from "./fsHelper";
import { Template } from "../../../services/api/paths/templates";

async function create(path?: string, url?: string) {
  const s = spinner.get();
  if (!path && !url) {
    s.fail("must provide either --path or --url");
    return;
  }
  let template: Template;
  // If user provides URL, we override "path" with location where data got cloned from the URL
  if (url) {
    path = await cloneRepo(url);
  }
  if(path) {
    template = await createTemplateFromFile(path);
    await uploadExtraAssets(path!, template.workspaceId, template.name);
  }
}

async function createTemplateFromFile(path: string): Promise<Template> {
  const s = spinner.get();
  s.start(`Creating a template`);
  const { metadata, template: t } = await pushHandlers.validate(path);

  const template = await api.templateCreate({
    name: metadata.service,
    description: metadata.description,
    variables: metadata.variables,
    template: t,
    public: true,
  });
  s.succeed();
  outputs.create(template, "json");
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
  create,
  list,
  get
};
