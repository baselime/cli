import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import pushHandlers from "../../push/handlers/handlers";
import { simpleGit } from 'simple-git';
import { mkdirSync, rmdirSync } from "fs";

async function create(path?: string, url?: string) {
  //TODO: add downloading and uploading the license and README
  const s = spinner.get();
  if(!path && !url) {
    s.fail("must provide either --path or --url");
    return;
  }
  if(url) {
    path = "/tmp/baselime/git"
    rmdirSync(path, {recursive: true});
    mkdirSync(path, {recursive: true});
    const git = simpleGit("/tmp/baselime/git");
    s.start(`Fetching templates from ${url}`);
    const cloneError = await git.clone(url, path);
    if(!cloneError) {
      await createTemplateFromFile(path);
    }
  } else {
    await createTemplateFromFile(path!)
  }
}

async function createTemplateFromFile(from: string) {
  const s = spinner.get();
  s.start(`Creates a template`);
  const {metadata, resources} = await pushHandlers.validate(from);

  const template = await api.templateCreate({
    resources,
    name: metadata.application,
    description: metadata.description,
    public: true,
  });
  s.succeed();
  outputs.create(template, "json");
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
  const templates = await api.templateGet(workspaceId, name);
  s.succeed();
  outputs.get(templates, "json");
}

export default {
  create,
  list,
  get
};
