import chalk from "chalk";
import checks, { DeploymentService, DeploymentResources, UserVariableInputs } from "./validators";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { readFileSync } from "fs";
import { getVersion, writeOutFile } from "../../../shared";
import { Ref, stringify } from "../../../services/parser/parser";
import Table from "cli-table3";
import { blankChars } from "../../../shared";

import * as prompts from "./prompts";
import { Deployment, DeploymentStatus } from "../../../services/api/paths/deployments";
import { promisify } from "util";
import { statusType, DiffResponse } from "../../../services/api/paths/diffs";

const wait = promisify(setTimeout);
const { BASELIME_DOMAIN = "baselime.io" } = process.env;

async function push(config: string, stage: string, userVariableInputs: UserVariableInputs, skip: boolean = false, dryRun: boolean = false) {
  const s = spinner.get();
  const { metadata, resources } = await validate(config, stage, userVariableInputs);
  s.start("Completing baselime plan...");
  await verifyPlan(metadata, resources, false);

  if (dryRun) {
    process.exit(0);
  }

  const res = skip ? true : await prompts.promptPush();

  if (!res) {
    process.exit(0);
  }

  writeOutFile(config, metadata, resources);
  s.start("Submitting the plan to the baselime backend...");
  const { url, id } = await api.uploadUrlGet(metadata.service, getVersion());
  const data = readFileSync(`${config}/.out/.baselime.json`, "utf-8").toString();
  await api.upload(url, data);
  s.start("Checking push status...");

  let isComplete = false;
  let deployment: Deployment | undefined = undefined;
  let count = 0;
  const maxCheck = 20;
  await wait(800);
  while (!isComplete && count < maxCheck) {
    await wait(800);
    deployment = await api.deploymentGet(metadata.service, id);
    isComplete = deployment.status !== DeploymentStatus.IN_PROGRESS;
    console.log(`\nStatus: ${chalk.bold(deployment.status)}`);
    count += 1;
  }
  if (deployment?.status === DeploymentStatus.SUCCESS) {
    s.succeed(`Successfully pushed an observability plan: ${chalk.bold(chalk.greenBright(id))}`);
    console.log();
    console.log(
      `Check it out in the console: https://console.${BASELIME_DOMAIN}/${deployment.workspaceId}/${deployment.environmentId}/${deployment.service}/home`,
    );
    return;
  }
  if (deployment?.status === DeploymentStatus.IN_PROGRESS) {
    s.info("Connection timed out.");
    return;
  }
  s.fail(`Failed to push an observability plan: ${chalk.bold(chalk.redBright(id))}
  ${chalk.red(deployment?.error || "")}`);
}

async function validate(
  folder: string,
  stage?: string,
  userVariableInputs?: UserVariableInputs,
): Promise<{ metadata: DeploymentService; resources: DeploymentResources; template: string }> {
  return await checks.validate(folder, stage, userVariableInputs);
}

export async function verifyPlan(metadata: DeploymentService, resources: DeploymentResources, reverse: boolean) {
  const diff = await api.diffsCreate({
    service: metadata.service,
    metadata: {
      description: metadata.description,
      provider: metadata.provider,
      version: metadata.version,
      infrastructure: metadata.infrastructure,
      // I've used "as any" because types defined in incoming metadata are infered from "yup", where as in api
      // we use defined by TS
      templates: metadata.templates as any,
      variables: metadata.variables as any,
    },
    resources,
    reverse,
  });

  await displayDiff(metadata.service, diff);
  return diff;
}

export async function displayDiff(service: string, diff: DiffResponse) {
  const s = spinner.get();
  const {
    resources: { queries, alerts, dashboards },
    service: appDiff,
  } = diff;

  const serviceTable = new Table({ chars: blankChars });
  serviceTable.push(getYamlString({ status: appDiff.status, value: appDiff.service }));

  const table = new Table({ chars: blankChars });

  queries.forEach((q) => {
    const { status, resource } = q;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = { type: "query", properties: resource.properties };
    table.push(getYamlString({ status, value }));
  });

  alerts.forEach((a) => {
    const { status, resource } = a;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {
      type: "alert",
      properties: {
        ...resource.properties,
        channels: resource.properties.channels,
        parameters: { ...resource.properties.parameters, query: new Ref(resource.properties.parameters.query) },
      },
    };
    table.push(getYamlString({ status, value }));
  });

  dashboards.forEach((d) => {
    const { status, resource } = d;
    if (status === statusType.VALUE_UNCHANGED) return;

    const value: Record<string, any> = {};
    value[resource.id!] = {
      type: "dashboard",
      properties: {
        ...resource.properties,
        parameters: {
          widgets: resource.properties.parameters?.widgets?.filter((w: any) => w).map((widget: any) => {
            return {
              ...widget,
              query: new Ref(widget!.query),
              queryId: undefined,
            }
          })
        },
      },
    };
    table.push(getYamlString({ status, value }));
  });

  console.log("\n\n" + chalk.bold(chalk.cyanBright(`Services: ${service}`)));
  console.log("\n\n" + serviceTable.toString() + "\n\n");
  console.log("\n\n" + table.toString() + "\n\n");

  const allResources = [...queries, ...alerts, ...dashboards];
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
  s.succeed(
    chalk.bold(
      `Service: ${chalk.bold(serviceStatus)}
    
  Resources
    ${chalk.greenBright(`${allResources.filter((r) => r.status === statusType.VALUE_CREATED).length} to add`)}
    ${chalk.yellowBright(`${allResources.filter((r) => r.status === statusType.VALUE_UPDATED).length} to change`)}
    ${chalk.redBright(`${allResources.filter((r) => r.status === statusType.VALUE_DELETED).length} to destroy`)}`,
    ),
  );
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
  push,
  validate,
};
