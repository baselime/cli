import { writeFileSync } from "fs";
import { outputFileSync } from "fs-extra";
import { readFile } from "fs/promises";
import {DiffResponse, statusType} from "../../services/api/paths/diffs";
import {parseFileContent, ResourceMap, stringify, stringifyResources} from "../../services/parser/parser";
import spinner from "../../services/spinner";
import {authenticate, getVersion} from "../../shared";
import { verifyPlan } from "../push/handlers/handlers";
import checks, {
  DeploymentAlert,
  DeploymentDashboard,
  DeploymentQuery, DeploymentResources,
  DeploymentService,
  UserVariableInputs
} from "../push/handlers/validators";
import {promptRefresh, promptService} from "./prompts";
import fs from "fs";
import {prompt} from "enquirer";
import api from "../../services/api/api";
import yaml from "yaml";
import {Query} from "../../services/api/paths/queries";
import {query, raw} from "express";

async function pull(directory: string, stage: string, userVariableInputs: UserVariableInputs, noAsk: boolean = false) {
  await checkIfDirectoryIsRaw(directory);
  const s = spinner.get();
  s.start("Checking resources to import...");
  let localResources = await checks.readResources(directory, stage, userVariableInputs);
  // write
  await downloadQueries(directory, localResources.metadata.service, localResources.resources.queries);

  // here we reload stuff again
  localResources = await checks.readResources(directory, stage, userVariableInputs, false);
  await verifyPlan(localResources.metadata, localResources.resources, false);
}

async function checkIfDirectoryIsRaw(directory: string): Promise<void> {
  try {
    await fs.accessSync(".baselime");
  } catch(err: any) {
    if (err && err.code === 'ENOENT') {
      const { name } = await prompt<{ name: string }>({
        type: "select",
        name: "name",
        message: `The configuration directory ${directory} does not exist. Would you like to initialise?`,
        choices: [{ name: "Yes" }, { name: "No" }],
      });
      if (name === "Yes") {
        await tryInitialiseForService(directory);
      }
    }
  }
}

async function tryInitialiseForService(directory: string): Promise<string> {
  const service = await promptService();
  if (!service) {
    process.exit(0);
  }
  const serviceData = await api.serviceGet(service);
  await fs.mkdirSync(directory, {recursive: true});
  const indexYamlData = {
    ...serviceData.metadata,
    service: service,
    templates: convertTemplates((serviceData.metadata as any).templates)
  }
  await fs.writeFileSync(`${directory}/index.yml`, yaml.stringify(indexYamlData));
  return service;
  // await writeTemplates(directory, (serviceData.metadata as any).templates)
  // await init(directory, service, description, "aws", undefined);
}

interface Template {
  name: string;
  applyOnSave: boolean;
  workspaceId: string
}

function convertTemplates(templates: Template[]) {
  if(!templates) return [];
  return templates.map(template => ({
    name: `${template.workspaceId}/${template.name}`,
  }));
}

async function downloadQueries(directory: string, service: string, localQueries: DeploymentQuery[] | undefined): Promise<ResourceMap> {
  spinner.get().info("Downloading queries");
  const queries = await api.queriesList(service);
  const queriesDict: Record<string, any> = {};
  for (const query of queries) {
    if(!localQueries?.some(localQuery=> localQuery.id == query.id)) {
      queriesDict[query.id] = convertQuery(query);
    }
  }
  if (Object.keys(queriesDict).length > 0) {
    await fs.appendFileSync(`${directory}/queries.yaml`, "\n" + yaml.stringify(queriesDict));
  }
  spinner.get().succeed("Queries downloaded");
  return queriesDict;
}

function convertQuery(query: Query) {
  return {
    type: "query",
    properties: {
      description: query.description,
      parameters: {
        ...query.parameters,
        filters: query.parameters.filters?.map(filter => (`${filter.key} ${filter.operation} ${filter.value}`)),
        calculations: query.parameters.calculations?.map(calculation => {
          return calculation.operator === "COUNT" ?
              "COUNT" :
              `${calculation.operator}(${calculation.key})`
        })
      }
    }
  }
}

export default {
  pull,
};
