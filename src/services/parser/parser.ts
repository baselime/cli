import { readFile } from "fs/promises";
import yaml, { Document } from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { DeploymentService, DeploymentResources } from "../../commands/push/handlers/checks";

export async function getResources(filenames: string[]) {
  const s = spinner.get();
  const result: Record<string, Record<string, any>> = {};

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
      const data = parse(file);
      for (const key in data) {
        if (Object.keys(result).includes(key)) {
          throw { code: "DUPLICATE_KEY", message: `Map keys must be unique across all config files: ${key} in ${filenames[index]}` };
        }
        result[key] = data[key];
      }
    } catch (error) {
      const message = `Error parsing a file\n${(error as any).code || ''}\n${(error as any).message || ''}`;
      s.fail(chalk.bold(chalk.redBright(`Validation error: ${filenames[index]}`)));
      console.error(message);
      throw new Error(message);
    }
  });

  return result;

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

export function parse(s: string): Record<string, Record<string, any>> {
  // @ts-ignore
  return yaml.parse(s, { customTags: [ref, variable] });
}

export function stringify(data: Record<string, any>): string {
  // @ts-ignore
  return yaml.stringify(data, { customTags: [ref, variable] });
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

export class Var {
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

const variable = {
  identify: (value: any) => value.constructor === Var,
  tag: '!var',
  resolve(doc: any, cst: any) {
    return `<var>${doc}</var>`;
  },
  stringify(item: any, ctx: any, onComment: any, onChompKeep: any) {
    return item.value.value;
  }
}
