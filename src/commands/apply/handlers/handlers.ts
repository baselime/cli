import chalk from "chalk";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";

async function apply(config: string) {
  const s = spinner.get();
  const metadata = await validate(config);
  s.start("Checking submission status...");
  const { url, id } = await api.uploadUrlGet(metadata.application, metadata.version);
  await api.uplaod(url, `${config}/.out/.baselime.json`);
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
