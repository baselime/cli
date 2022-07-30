import { readFile } from "fs/promises";
import yaml, { Document } from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { stringifyString } from 'yaml/util'

export async function getResources(filenames: string[]) {
  try {
    const files = await Promise.all(filenames.map(async filename => (await readFile(filename)).toString()));
    return yaml.parse(files.join("\n"), { customTags: [ref] });
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || 'Error parsing file'}`;
    s.fail(chalk.bold(chalk.red("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export async function getMetadata(folder: string) {
  try {
    const file = (await readFile(`${folder}/index.yml`)).toString()
    return yaml.parse(file);
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || 'Error parsing metadata file'}`;
    s.fail(chalk.bold(chalk.red("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export function stringify(data: Record<string, any>): string {
  return yaml.stringify(data, { customTags: [ref] });
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
  resolve(doc: Document, cst: any) {
    return cst.strValue;
  },
  stringify(item: any, ctx: any, onComment: any, onChompKeep: any) {
    return item.value.value;
  }
}