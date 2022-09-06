import { readFile } from "fs/promises";
import yaml, { Document } from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";

export async function getResources(filenames: string[]) {
  try {
    const files = await Promise.all(filenames.map(async filename => (await readFile(filename)).toString()));
    return parse(files.join("\n"));
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
    const metadata = yaml.parse(file);
    return metadata;
  } catch (error) {
    const s = spinner.get();
    const message = `${(error as any).message || 'Error parsing metadata file'}`;
    s.fail(chalk.bold(chalk.red("Validation error")));
    console.log(message);
    throw new Error(message);
  }
}

export function parse(s: string): Record<string, any> {
  // @ts-ignore
  return yaml.parse(s, { customTags: [ref, variable] });
}

export function stringify(data: Record<string, any>): string {
  // @ts-ignore
  return yaml.stringify(data, { customTags: [ref, variable] });
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
