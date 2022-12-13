import { readFile } from "fs/promises";
import yaml from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { DeploymentResources, DeploymentVariable } from "../../commands/push/handlers/validators";
import mustache from "mustache";

export async function readResourcesFromFiles(filenames: string[], variables?: { [name: string]: DeploymentVariable }): Promise<{ resources: Record<string, Record<string, any>>; template: string }> {
  const resources: Record<string, Record<string, any>> = {};
  // First read all the files
  const files = await Promise.all(filenames.map(async filename => readResourcesFromFile(filename)));
  // Then parse it, and append to resources
  files.forEach((file, index) => parseAndAppendFileToResources(file, resources, variables));
  return {resources, template: files.join("\n")};
}

export function parseAndAppendFileToResources(fileContents: string, resources: Record<string, Record<string, any>>, variables?: { [name: string]: DeploymentVariable }) {
  try {
    const data = parseFileContent(fileContents, variables);
    appendToResourcesSafely(resources, data);
  } catch (error) {
    const message = `Error parsing a file\n${(error as any).code || ''}\n${(error as any).message || ''}`;
    spinner.get().fail(chalk.bold(chalk.redBright(`Validation error: ${fileContents}`)));
    console.error(message);
    throw new Error(message);
  }
}

function appendToResourcesSafely(resources: Record<string, any>, data: Record<string, Record<string, any>>) {
  for (const key in data) {
    if (Object.keys(resources).includes(key)) {
      throw {code: "DUPLICATE_KEY", message: `Map keys must be unique across all config files: ${key}`};
    }
    resources[key] = data[key];
  }
}

export async function readResourcesFromFile(path: string): Promise<string> {
  const s = spinner.get();
  try {
    return (await readFile(path)).toString();
  } catch (error) {
    const message = `Error reading a file: ${path}\n${(error as any).message || ''}`;
    s.fail(chalk.bold(chalk.redBright(`Validation error: ${path}`)));
    console.error(message);
    throw new Error(message);
  }
}

export async function readVariables(path: string): Promise<Record<string, any> | undefined> {
  try {
    const file = (await readFile(path)).toString()
    const metadata = yaml.parse(file);
    return metadata.variables;
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || `Error parsing variables from ${path}`}`;
    s.fail(chalk.bold(chalk.redBright("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export async function readMetadata(folder: string, variables?: { [name: string]: DeploymentVariable }): Promise<Record<string, Record<string, any>>> {
  try {
    const file = (await readFile(`${folder}/index.yml`)).toString()
    const metadata = parseFileContent(file, variables);
    if (metadata.infrastructure && !metadata.infrastructure.stacks?.length) {
      metadata.infrastructure.stacks = undefined;
    }
    return metadata;
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || 'Error parsing metadata file'}`;
    s.fail(chalk.bold(chalk.redBright("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export function parseFileContent(contents: string, variables?: { [name: string]: DeploymentVariable }): Record<string, Record<string, any>> {
  const variableNames = Object.keys(variables || {});
  if (!variables || variableNames?.length === 0) {
    // @ts-ignore
    return yaml.parse(contents, {customTags: [ref]});
  }

  const vals: Record<string, any> = {}
  variableNames.forEach(variable => {
    if (variables[variable]) {
      vals[variable] = variables[variable]!.value || variables[variable]!.default;
    }
  });
  
  const val = mustache.render(contents, vals);
  // @ts-ignore
  return yaml.parse(val, {customTags: [ref]});
}

export function stringify(data: Record<string, any>): string {
  // @ts-ignore
  return yaml.stringify(data, {customTags: [ref]});
}

export function stringifyResources(resources: DeploymentResources) {
  const data: Record<string, any> = {};
  const {queries, alerts} = resources;
  queries?.forEach((elt) => {
    data[elt.id!] = {
      type: "query",
      properties: {
        ...elt.properties,
        id: undefined,
      }
    }
  });

  alerts?.forEach((elt) => {
    data[elt.id!] = {
      type: "alert",
      properties: {
        ...elt.properties,
        parameters: {...elt.properties.parameters, query: new Ref(elt.properties.parameters.query)},
        id: undefined,
      }
    };
  });

  if (!Object.keys(data).length) return ""!
  return stringify(data);
}

export class Ref {
  public value;

  constructor(value: string) {
    this.value = value;
  }
}

const ref = {
  identify: (value: any) => value.constructor === Ref,
  tag: '!ref',
  resolve(doc: any, cst: any) {
    return doc;
  },
  stringify(item: any, ctx: any, onComment: any, onChompKeep: any) {
    return item.value.value;
  }
}
