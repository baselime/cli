import chalk from "chalk";
import checks from "./checks";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";

async function apply(file: string, application: string, version: string) {
  const s = spinner.get();

  await checks.apply(file);

  s.start("Checking submission status...");
  const { url, id } = await api.uploadUrlGet(application, version);
  await api.uplaod(url, file);
  s.succeed(
    `Submitted your observability configurations. id: ${chalk.bold(
      chalk.cyan(id),
    )}`,
  );
}

export default {
  apply,
};
