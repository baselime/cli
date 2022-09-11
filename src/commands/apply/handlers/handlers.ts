import chalk from "chalk";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { readFileSync } from "fs";
import { getVersion, writeOutFile } from "../../../shared";
import { verifyPlan } from "../../plan/handlers";
import * as prompts from "./prompts";

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
  s.start("Checking submission status...");
  const { url, id } = await api.uploadUrlGet(metadata.application, getVersion());
  const data = readFileSync(`${config}/.out/.baselime.json`, "utf-8").toString();
  await api.uplaod(url, data);
  s.succeed(
    `Submitted your observability configurations. id: ${chalk.bold(
      chalk.cyan(id),
    )}`,
  );
}

async function validate(folder: string) {
  return await checks.validate(folder);
}

export default {
  apply,
  validate,
};
