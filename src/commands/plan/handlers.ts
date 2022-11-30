import chalk from "chalk";
import api from "../../services/api/api";
import { Ref, stringify } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import checks, { DeploymentApplication, DeploymentResources } from "../apply/handlers/checks";
import Table, { CrossTableRow, HorizontalTableRow, VerticalTableRow } from "cli-table3";
import { DiffResponse, statusType } from "../../services/api/paths/diffs";
import { blankChars } from "../../shared";

async function plan(config: string) {
  const s = spinner.get();
  const {metadata, resources} = await checks.validate(config);
  s.start("Completing baselime plan...");
  await verifyPlan(metadata, resources, false);
}

export async function verifyPlan(metadata: DeploymentApplication, resources: DeploymentResources, reverse: boolean) {
  const diff = await api.diffsCreate({
    application: metadata.application,
    metadata: {
      description: metadata.description,
      provider: metadata.provider,
      version: metadata.version,
      infrastructure: metadata.infrastructure
    },
    resources,
    reverse,
  });

  displayDiff(metadata.application, diff);
  return diff;
}

export async function displayDiff(application: string, diff: DiffResponse) {
  const s = spinner.get();
  const {resources: {queries, alerts, channels}, application: appDiff} = diff;

  const applicationTable = new Table({chars: blankChars});
  applicationTable.push(getYamlString({status: appDiff.status, value: appDiff.application}));

  const table = new Table({chars: blankChars});

  queries.forEach(query => {
    const {status, resource, deepDiff} = query;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {type: "query", properties: resource.properties}
    table.push(getYamlString({status, value, deepDiff}));
  });

  alerts.forEach(alert => {
    const {status, resource, deepDiff} = alert;
    console.log(deepDiff);
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {
      type: "alert",
      properties: {
        ...resource.properties,
        channels: resource.properties.channels.map((c: string) => new Ref(c)),
        parameters: {...resource.properties.parameters, query: new Ref(resource.properties.parameters.query)}
      }
    };
    table.push(getYamlString({status, value, deepDiff}));
  });
  channels.forEach(channel => {
    const {status, resource, deepDiff} = channel;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {type: "channel", properties: resource.properties};
    table.push(getYamlString({status, value, deepDiff}));
  });


  console.log("\n\n" + chalk.bold(chalk.cyanBright(`Application: ${application}`)))
  console.log("\n\n" + applicationTable.toString() + "\n\n");
  console.log("\n\n" + table.toString() + "\n\n");

  const allResources = [...queries, ...alerts, ...channels];
  const applicationStatus = (() => {
    switch (appDiff.status) {
      case statusType.VALUE_CREATED:
        return chalk.greenBright("to be created");
      case statusType.VALUE_UPDATED:
        return chalk.yellowBright("to be updated");
      case statusType.VALUE_DELETED:
        return chalk.redBright("to be deleted");
      case statusType.VALUE_UNCHANGED:
        return chalk.whiteBright("unchanged");
      default:
        break;
    }
  })();
  s.succeed(chalk.bold(
      `Application: ${chalk.bold(applicationStatus)}
    
  Resources
    ${chalk.greenBright(allResources.filter(r => r.status === statusType.VALUE_CREATED).length + " to add")}
    ${chalk.yellowBright(allResources.filter(r => r.status === statusType.VALUE_UPDATED).length + " to change")}
    ${chalk.redBright(allResources.filter(r => r.status === statusType.VALUE_DELETED).length + " to destroy")}`
  ));
}

function getYamlString(obj: { status: statusType; value: Record<string, any>, deepDiff?: object }): HorizontalTableRow | VerticalTableRow | CrossTableRow {
  const {status, value, deepDiff} = obj;

  if (status === statusType.VALUE_CREATED) {
    return [chalk.greenBright.bold("++"), chalk.greenBright(stringify(value))];
  }
  if (status === statusType.VALUE_UPDATED) {
    // console.log(deepDiff, value);
    // console.log(chalk.yellowBright.bold("~~ blabla"));
    const val = x(value, deepDiff);
    console.log(val);
    return [chalk.yellowBright.bold("~~"), val];
    // return [chalk.yellowBright.bold("~~"), chalk.yellowBright(stringify(value))];
  }
  if (status === statusType.VALUE_DELETED) {
    return [chalk.redBright.bold("--"), chalk.redBright(stringify(value))];
  }
  return [];
}

export default {
  plan,
};

function x(value: Record<string, any>, deepDiff: Record<string, any> | undefined): string {
  const [name] = Object.keys(value);
  const composite = `${name}:`;
  if (deepDiff) {
    return composite + printLayer(value[name].properties, deepDiff, 2);
  }
  return "";
}

function printLayer(sourceObj: Record<string, any>, diffObj: Record<string, any> | undefined, indent: number = 0): string {
  let composite = "";
  const sourceKeys = Object.keys(sourceObj).sort();
  sourceKeys.forEach(key => {
    const currentObj = sourceObj[key];
    const indentString = "\n" + " ".repeat(indent);
    const common = key + ": ";
    switch (typeof currentObj) {
      case "string":
      case "number":
      case "boolean":
      case "bigint":
      case "symbol":
        if (diffObj && diffObj[key]) {
          composite += indentString + chalk.yellowBright.bold(`--${common}${diffObj[key]["__old"]!}`);
          composite += indentString + chalk.yellowBright.bold(`++${common}${diffObj[key]["__new"]!}`);
        } else {
          composite += indentString + common + currentObj.toString();
        }
        break;
      case "object":
        if (Array.isArray(currentObj)) {
          composite += printArray(currentObj, diffObj as any)
        } else {
          composite += indentString + common + printLayer(currentObj, diffObj && diffObj[key], indent + 2);
        }
    }
  });
  return composite
}

function printArray(arr: any[], diffObj: any[], indent: number = 0): string {
  const indentString = "\n" + " ".repeat(indent);
  const start = indentString + "[";
  const end = indentString + "]";
  return start +
      arr.map((item, index) => {
        printVariable(item, diffObj && diffObj[index], indent + 2)
      })
      + end;
}

function printVariable(currentObj: object, diffObj: Record<string, any>, indent: number = 0) {
  let composite = "";
  const indentString = "\n" + " ".repeat(indent);
  switch (typeof currentObj) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
      if (diffObj) {
        composite += indentString + chalk.yellowBright.bold(`--${diffObj["__old"]!}`);
        composite += indentString + chalk.yellowBright.bold(`++${diffObj["__new"]!}`);
      } else {
        composite += indentString + (currentObj as any).toString();
      }
      break;
    case "object":
      if (Array.isArray(currentObj)) {
        return printArray(currentObj, diffObj as any)
      } else {
        return printLayer(currentObj, diffObj, indent +2)
      }
  }
}