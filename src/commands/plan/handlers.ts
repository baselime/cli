import chalk from "chalk";
import api from "../../services/api/api";
import { Ref, stringify } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import checks, { DeploymentService, DeploymentResources, UserVariableInputs } from "../push/handlers/checks";
import Table from "cli-table3";
import { DiffResponse, statusType } from "../../services/api/paths/diffs";
import { blankChars } from "../../shared";

async function plan(config: string, stage: string, userVariableInputs: UserVariableInputs) {
  const s = spinner.get();
  const { metadata, resources } = await checks.validate(config, stage, userVariableInputs);
  s.start("Completing baselime plan...");
  await verifyPlan(metadata, resources, false);
}

export async function verifyPlan(metadata: DeploymentService, resources: DeploymentResources, reverse: boolean) {
  const diff = await api.diffsCreate({
    service: metadata.service,
    metadata: {
      description: metadata.description,
      provider: metadata.provider,
      version: metadata.version,
      infrastructure: metadata.infrastructure
    },
    resources,
    reverse,
  });

  displayDiff(metadata.service, diff);
  return diff;
}

export async function displayDiff(service: string, diff: DiffResponse) {
  const s = spinner.get();
  const { resources: { queries, alerts }, service: appDiff } = diff;

  const serviceTable = new Table({ chars: blankChars });
  serviceTable.push(getYamlString({ status: appDiff.status, value: appDiff.service }));

  const table = new Table({ chars: blankChars });

  queries.forEach(q => {
    const { status, resource } = q;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = { type: "query", properties: resource.properties }
    table.push(getYamlString({ status, value }));
  });

  alerts.forEach(a => {
    const { status, resource } = a;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {
      type: "alert",
      properties: {
        ...resource.properties,
        channels: resource.properties.channels,
        parameters: { ...resource.properties.parameters, query: new Ref(resource.properties.parameters.query) }
      }
    };
    table.push(getYamlString({ status, value }));
  });

  console.log("\n\n" + chalk.bold(chalk.cyanBright(`Services: ${service}`)))
  console.log("\n\n" + serviceTable.toString() + "\n\n");
  console.log("\n\n" + table.toString() + "\n\n");

  const allResources = [...queries, ...alerts];
  const serviceStatus = (() => {
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
    `Service: ${chalk.bold(serviceStatus)}
    
  Resources
    ${chalk.greenBright(allResources.filter(r => r.status === statusType.VALUE_CREATED).length + " to add")}
    ${chalk.yellowBright(allResources.filter(r => r.status === statusType.VALUE_UPDATED).length + " to change")}
    ${chalk.redBright(allResources.filter(r => r.status === statusType.VALUE_DELETED).length + " to destroy")}`
  ));
}

function getYamlString(obj: { status: statusType; value: Record<string, any> }) {
  const { status, value } = obj;

  if (status === statusType.VALUE_CREATED) {
    return [chalk.greenBright.bold("++"), chalk.greenBright(stringify(value))];
  }
  if (status === statusType.VALUE_UPDATED) {
    return [chalk.yellowBright.bold("~~"), chalk.yellowBright(stringify(value))];
  }
  if (status === statusType.VALUE_DELETED) {
    return [chalk.redBright.bold("--"), chalk.redBright(stringify(value))];
  }
  return [];
}

export default {
  plan,
};
