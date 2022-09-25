import chalk from "chalk";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { readFileSync } from "fs";
import { getVersion, writeOutFile } from "../../../shared";
import { verifyPlan } from "../../plan/handlers";
import * as prompts from "./prompts";
import { Deployment, DeploymentStatus } from "../../../services/api/paths/deployments";
import { promisify } from "util";

const wait = promisify(setTimeout);

async function apply(config: string, skip: boolean = false) {
  const s = spinner.get();
  const { metadata, resources } = await validate(config);
  s.start("Completing baselime plan...");
  await verifyPlan(metadata, resources, false);

  const res = skip ? true : await prompts.promptApply();

  if (!res) {
    process.exit(0);
  }

  writeOutFile(config, metadata, resources);
  s.start("Submitting the plan to the baselime backend...");
  const { url, id } = await api.uploadUrlGet(metadata.application, getVersion());
  const data = readFileSync(`${config}/.out/.baselime.json`, "utf-8").toString();
  await api.uplaod(url, data);
  s.start("Checking apply status...");


  let isComplete = false;
  let deployment: Deployment | undefined = undefined;
  let count = 0;
  const maxCheck = 20;
  while (!isComplete && count < maxCheck) {
    await wait(800);
    deployment = await api.deploymentGet(metadata.application, id);
    isComplete = deployment.status != DeploymentStatus.IN_PROGRESS;
    console.log(`\nStatus: ${chalk.bold(deployment.status)}`);
    count += 1;
  }
  if (deployment?.status === DeploymentStatus.SUCCESS) {
    s.succeed(`Successfully applied an observability plan: ${chalk.bold(chalk.greenBright(id),)}`);
    return;
  }
  s.fail(`Failed to apply an observability plan: ${chalk.bold(chalk.redBright(id),)}`);
}

async function validate(folder: string) {
  return await checks.validate(folder);
}

export default {
  apply,
  validate,
};
