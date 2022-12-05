import { readFile } from "fs/promises";
import yaml, { Document } from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { DeploymentService, DeploymentResources, DeploymentVariable } from "../../commands/push/handlers/checks";
import mustache from "mustache";


export async function getResources(filenames: string[], variables?: { [name: string]: DeploymentVariable }): Promise<{resources: Record<string, Record<string, any>>; template: string}> {
  const s = spinner.get();
  const resources: Record<string, Record<string, any>> = {};

  const files = await Promise.all(filenames.map(async filename => {
    try {
      return (await readFile(filename)).toString();
    } catch (error) {
      const message = `Error reading a file: ${filename}\n${(error as any).message || ''}`;
      s.fail(chalk.bold(chalk.redBright(`Validation error: ${filename}`)));
      console.error(message);
      throw new Error(message);
    }
  }));

  files.forEach((file, index) => {
    try {
      const data = parse(file, variables);
      for (const key in data) {
        if (Object.keys(resources).includes(key)) {
          throw { code: "DUPLICATE_KEY", message: `Map keys must be unique across all config files: ${key} in ${filenames[index]}` };
        }
        resources[key] = data[key];
      }
    } catch (error) {
      const message = `Error parsing a file\n${(error as any).code || ''}\n${(error as any).message || ''}`;
      s.fail(chalk.bold(chalk.redBright(`Validation error: ${filenames[index]}`)));
      console.error(message);
      throw new Error(message);
    }
  });

  return {resources, template: files.join("\n")};

}

export async function getMetadata(folder: string): Promise<DeploymentService> {
  try {
    const file = (await readFile(`${folder}/index.yml`)).toString()
    const metadata = yaml.parse(file);
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

export function parse(s: string, variables?: { [name: string]: DeploymentVariable }): Record<string, Record<string, any>> {
  const variableNames = Object.keys(variables || {});
  if (!variables || variableNames?.length === 0) {
    // @ts-ignore
    return yaml.parse(s, { customTags: [ref] });
  }

  const vals: Record<string, any> = {}
  variableNames.forEach(variable => {
    if (variables[variable]) {
      vals[variable] = variables[variable]!.value || variables[variable]!.default;
    }
  });

  const val = mustache.render(s, vals);
  // @ts-ignore
  return yaml.parse(val, { customTags: [ref] });
}

export function stringify(data: Record<string, any>): string {
  // @ts-ignore
  return yaml.stringify(data, { customTags: [ref] });
}

export function stringifyResources(resources: DeploymentResources) {
  const data: Record<string, any> = {};
  const { queries, alerts } = resources;
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
        parameters: { ...elt.properties.parameters, query: new Ref(elt.properties.parameters.query) },
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
