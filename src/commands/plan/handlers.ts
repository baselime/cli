import chalk from "chalk";
import api from "../../services/api/api";
import { Ref, stringify } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import checks, { DeploymentApplication, DeploymentResources } from "../push/handlers/checks";
import Table  from "cli-table3";
import { DiffResponse, statusType } from "../../services/api/paths/diffs";
import { blankChars } from "../../shared";
import { printDiff } from "./diff";

async function plan(config: string) {
  const s = spinner.get();
  const { metadata, resources } = await checks.validate(config);
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
  const {resources: {queries, alerts}, application: appDiff} = diff;

  const applicationTable = new Table({ chars: blankChars });
  applicationTable.push(getYamlString({
    status: appDiff.status,
    value: appDiff.application,
    deepDiff: appDiff.deepDiff ? appDiff.deepDiff.metadata : undefined,
  }));

  const table = new Table({ chars: blankChars });

  queries.forEach(query => {
    const { status, resource } = query;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = { type: "query", properties: resource.properties }
    table.push(getYamlString({
      status,
      value,
      deepDiff: {
        [resource.id!]: {
          properties: query.deepDiff
        }
      }
    }));
  });

  alerts.forEach(alert => {
    const { status, resource } = alert;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {
      type: "alert",
      properties: {
        ...resource.properties,
        channels: resource.properties.channels.map((c: string) => new Ref(c)),
        parameters: { ...resource.properties.parameters, query: new Ref(resource.properties.parameters.query) }
      }
    };
    table.push(getYamlString({
      status,
      value,
      deepDiff: {
        [resource.id!]: {
          properties: alert.deepDiff
        }
      },
    }));
  });

  console.log("\n\n" + chalk.bold(chalk.cyanBright(`Application: ${application}`)))
  console.log("\n\n" + applicationTable.toString() + "\n\n");
  console.log("\n\n" + table.toString() + "\n\n");

  const allResources = [...queries, ...alerts];
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

function getYamlString(obj: { status: statusType; value: Record<string, any>, deepDiff?: object }) {
  const { status, value, deepDiff } = obj;

  if (status === statusType.VALUE_CREATED) {
    return [chalk.greenBright.bold("++"), chalk.greenBright(stringify(value))];
  }
  if (status === statusType.VALUE_UPDATED) {
    const val = printDiff(deepDiff);
    return [chalk.yellowBright.bold("~~"), val];
  }
  if (status === statusType.VALUE_DELETED) {
    return [chalk.redBright.bold("--"), chalk.redBright(stringify(value))];
  }
  return [];
}

export default {
  plan,
};
