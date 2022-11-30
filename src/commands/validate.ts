import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./push/handlers/handlers";

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
        default: ".baselime",
      },
    })
    .example([
      [`
      $0 validate
      $0 validate --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);

  await handlers.validate(config!);
}

