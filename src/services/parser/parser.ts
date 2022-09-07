import { readFile } from "fs/promises";
import yaml, { Document } from "yaml";
import chalk from "chalk";
import spinner from "../spinner/index";
import { DeploymentResources } from "../../commands/apply/handlers/checks";

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
  const { queries, alerts, channels, dashboards, charts } = resources;
  queries.forEach((elt) => {
    data[elt.id!] = {
      type: "query",
      properties: {
      ...elt.properties,
      id: undefined,  
    }
    }
  });

  alerts.forEach((elt) => {
    data[elt.id!] = {
      type: "alert",
      properties: {
        ...elt.properties,
        channels: elt.properties.channels.map(c => new Ref(c)),
        parameters: { ...elt.properties.parameters, query: new Ref(elt.properties.parameters.query) },
        id: undefined,
      }
    };
  });

  channels.forEach((elt) => {
    data[elt.id!] = {
      type: "channel",
      properties: {
        ...elt.properties,
        id: undefined,
      }
    }
  });

  charts.forEach((elt) => {
    data[elt.id!] = {
      type: "chart",
      properties: {
        ...elt.properties,
        parameters: { ...elt.properties.parameters, query: new Ref(elt.properties.parameters.query) } },
        id: undefined,
    };
  });

  dashboards.forEach((elt) => {
    data[elt.id!] = {
      type: "dashboard",
      properties: { 
        ...elt.properties,
        charts: elt.properties.charts.map(c => new Ref(c)),
        id: undefined,
      }
    };
  });

  if(!Object.keys(data).length) return ""!
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
