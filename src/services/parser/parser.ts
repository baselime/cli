import { readFile } from "fs/promises";
import yaml from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { DeploymentResources, DeploymentVariable } from "../../commands/push/handlers/validators";
import mustache from "mustache";
import { getLogger } from "../../utils";

export interface ResourceDescriptor {
  file: string;
  resource: Resource;
}
export interface Resource {
  id: string;
  type: string;
  stacks?: any[];
}
export type ResourceMap = Record<string, ResourceDescriptor>;
export type ResourceDictionary = Record<string, Resource>;
export type VariableDictionary = Record<string, DeploymentVariable>;

export async function readResourcesFromFiles(filenames: string[], variables?: VariableDictionary): Promise<{ resources: ResourceMap; raw: string }> {
  getLogger().debug(`reading resources from files ${filenames}`);
  const allResources: ResourceMap = {};
  // First read all the files
  // const files = await Promise.all(filenames.map(async (filename) => readResourcesFromFile(filename)));
  let rawCombined: string = "";
  for await (const filename of filenames) {
    const { resourceMap, raw } = await readResourcesFromFile(filename, variables);
    appendToResourcesSafely(allResources, resourceMap);
    rawCombined = rawCombined.concat("\n", raw);
  }
  return { resources: allResources, raw: rawCombined };
}

export function appendToResourcesSafely(existingResources: ResourceMap, newResources: ResourceMap) {
  for (const key in newResources) {
    const alreadyIn = existingResources[key];
    if (alreadyIn) {
      throw {
        code: "DUPLICATE_KEY",
        message: `Duplicate key ${key} in files ${alreadyIn.file} and ${newResources[key].file}. Keys must be unique.`,
      };
    }
    existingResources[key] = newResources[key];
  }
}

export async function readResourcesFromFile(filePath: string, variables?: VariableDictionary): Promise<{ resourceMap: ResourceMap; raw: string }> {
  const s = spinner.get();
  try {
    const contents = (await readFile(filePath)).toString();
    const resources = parseFileContent(contents, variables);
    const resourceMap: ResourceMap = {};
    // populates the file path, since parseFileContent knows nothing about source file
    for (const key of Object.keys(resources)) {
      resourceMap[key] = {
        file: filePath,
        resource: resources[key],
      };
    }
    return { resourceMap, raw: contents };
  } catch (error) {
    const message = `Error reading a file: ${filePath}\n${(error as any).message || ""}`;
    s.fail(chalk.bold(chalk.redBright(`Validation error: ${filePath}`)));
    console.error(message);
    throw new Error(message);
  }
}

export async function readMetaVariables(rawMeta: string): Promise<Record<string, any> | undefined> {
  try {
    const metadata = yaml.parse(rawMeta);
    return metadata.variables;
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || "Error parsing variables from index file"}`;
    s.fail(chalk.bold(chalk.redBright("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export async function readMetadata(rawMeta: string, variables?: { [name: string]: DeploymentVariable }): Promise<Record<string, Record<string, any>>> {
  try {
    getLogger().debug("parsing metadata");
    const metadata = parseFileContent(rawMeta, variables);
    if (metadata.infrastructure && !metadata.infrastructure.stacks?.length) {
      metadata.infrastructure.stacks = undefined;
    }
    return metadata;
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || "Error parsing metadata file"}`;
    s.fail(chalk.bold(chalk.redBright("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export function parseFileContent(contents: string, variables?: VariableDictionary): ResourceDictionary {
  if (!contents) {
    getLogger().debug("file empty - skipping");
    return {};
  }
  const variableNames = Object.keys(variables || {});
  if (!variables || variableNames?.length === 0) {
    // @ts-ignore
    return yaml.parse(contents, { customTags: [ref] });
  }

  const vals: Record<string, any> = {};
  variableNames.forEach((variable) => {
    if (variables[variable]) {
      vals[variable] = variables[variable]!.value || variables[variable]!.default;
    }
  });

  const val = mustache.render(contents, vals);
  // @ts-ignore
  return yaml.parse(val, { customTags: [ref] });
}

export function stringify(data: Record<string, any>): string {
  // @ts-ignore
  return yaml.stringify(data, { customTags: [ref] });
}

export function stringifyResources(resources: DeploymentResources) {
  const data: Record<string, any> = {};
  const { queries, alerts, dashboards } = resources;
  queries?.forEach((elt) => {
    data[elt.id!] = {
      type: "query",
      properties: {
        ...elt.properties,
        id: undefined,
      },
    };
  });

  alerts?.forEach((elt) => {
    data[elt.id!] = {
      type: "alert",
      properties: {
        ...elt.properties,
        parameters: { ...elt.properties.parameters, query: new Ref(elt.properties.parameters.query) },
        id: undefined,
      },
    };
  });

  dashboards?.forEach((elt) => {
    data[elt.id!] = {
      type: "dashboard",
      properties: {
        ...elt.properties,
        parameters: {
          widgets: elt.properties.parameters?.widgets
            ?.filter((w) => w)
            .map((widget) => {
              return {
                ...widget,
                query: new Ref(widget!.query),
                queryId: undefined,
              };
            }),
        },
        id: undefined,
      },
    };
  });

  if (!Object.keys(data).length) return ""!;
  return stringify(data);
}

export class Ref {
  public value;

  constructor(value: string) {
    this.value = value;
  }
}

const ref = {
  identify: (value: any) => value?.constructor === Ref,
  tag: "!ref",
  resolve(doc: any, cst: any) {
    return doc;
  },
  stringify(item: any, ctx: any, onComment: any, onChompKeep: any) {
    return item.value.value;
  },
};
