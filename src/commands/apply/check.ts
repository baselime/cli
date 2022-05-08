import { Arguments, CommandBuilder } from "yargs";

import { readFileSync } from "fs";
import yaml from "yaml";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import spinner from "../../services/spinner";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  config?: string;
  id: string;
}

export const command = "check";
export const desc = "Checks a baselime config";

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
      id: {
        type: "string",
        desc: "deployment id",
      },
    })
    .example([
      ["$0 apply check --id "],
    ])
    .demandOption(["id"])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { id, profile, config, json } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile!);

  const file = readFileSync(config!).toString();
  const { application } = yaml.parse(file);
  await handlers.check(application, id, !!json);
}


export enum subCommand {
  check = "check",
}