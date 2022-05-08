import chalk from "chalk";
import outputs from "./outputs";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";

async function apply(file: string, application: string, version: string) {
  const s = spinner.get();

  await checks.apply(file);

  s.start("Checking submission status...");
  const { url, id } = await api.getUploadUrl(application, version);
  await api.uplaod(url, file);
  s.succeed(
    `Submitted your observability configurations. id: ${chalk.bold(
      chalk.cyan(id),
    )}`,
  );
}

async function check(application: string, id: string, json: boolean) {
  const s = spinner.get();

  s.start("Checking deployment status...");
  const deployment = await api.getDeployment(application, id);
  s.succeed();
  outputs.check(deployment, json);
}

export default {
  apply,
  check,
};
