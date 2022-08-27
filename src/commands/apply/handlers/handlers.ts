import chalk from "chalk";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { readFileSync } from "fs";
import { writeOutFile } from "../../../shared";

async function apply(config: string) {
  const s = spinner.get();
  const { metadata, resources } = await validate(config);
  writeOutFile(config, metadata, resources);
  s.start("Checking submission status...");
  const { url, id } = await api.uploadUrlGet(metadata.application, metadata.version);
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
