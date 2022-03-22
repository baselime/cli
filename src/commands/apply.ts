import { Arguments, CommandBuilder } from "yargs";

import api from "../services/api/api";
import { authenticate, baseOptions } from "../shared";
import spinner from "../services/spinner/index";
import { readFileSync } from "fs";
import { Options } from "./apply/types";
import yaml from "yaml";
import chalk from "chalk";

export const command = "apply";
export const desc = "Executes changes to the observability configs";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "config file",
        alias: "c",
        default: ".baselime.yml",
      },
    })
    .example([
      ["$0 apply"],
      ["$0 apply --config .baselime.yml --profile prod"],
    ]);
};

export async function handler(argv: Arguments<Options>) {
  const { config = ".baselime.yml", profile = "default" } = argv;
  const s = spinner.init(!!argv.quiet);

  await authenticate(profile);

  const file = readFileSync(config).toString();

  const { version, application } = yaml.parse(file);
  s.start("Checking submission status...");
  const { url, id } = await api.getUploadUrl(application, version);
  await api.uplaod(url, file);
  s.succeed(
    `✨ Submitted your observability configurations. id: ${chalk.bold(
      chalk.cyan(id),
    )}`,
  );
}
