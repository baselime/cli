import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import { readFileSync } from "fs";
import yaml from "yaml";
import handlers from "./apply/handlers/handlers";

export interface Options extends BaseOptions {
  config?: string;
}

export const command = "validate";
export const desc = "Check whether the configuration is valid";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration file to execute",
        alias: "c",
        default: ".baselime.yml",
      },
    })
    .example([
      [`
      $0 validate
      $0 validate --config .baselime.yml --profile prod`,
      ],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);

  const file = readFileSync(config!).toString();
  await handlers.validate(file);
}

