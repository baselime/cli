import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import pushHandlers from "../../push/handlers/handlers";
import { simpleGit } from 'simple-git';
import { mkdirSync, rmdirSync } from "fs";
import { Template } from "../../../services/api/paths/templates";

async function create(path?: string, url?: string) {
  const s = spinner.get();
  if (!path && !url) {
    s.fail("must provide either --path or --url");
    return;
  }
  if (url) {
    const tempDirPath = "/tmp/baselime/git"
    rmdirSync(tempDirPath, { recursive: true });
    mkdirSync(tempDirPath, { recursive: true });
    const git = simpleGit("/tmp/baselime/git");
    s.start(`Fetching template from ${url}`);
    const cloneError = await git.clone(url!, tempDirPath);
    if (!cloneError) {
      await createTemplateFromFile(tempDirPath);
    }
  } else {
    await createTemplateFromFile(path!)
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
  // getUploadURL()
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

async function getUploadURL(workspaceId: string, name: string) {
  const response = await api.templateGetUploadUrl(workspaceId, name);
  console.log(response);
}

export default {
  create,
  list,
  get
};
