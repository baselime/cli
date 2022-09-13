import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./plan/handlers";

export interface Options extends BaseOptions {
  config?: string;
}

export const command = "plan";
export const desc = "Show changes required by the current configuration";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration folder to execute",
        alias: "c",
        default: ".baselime",
      },
    })
    .example([
      [`
      $0 plan
      $0 plan --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile } = argv;
  await authenticate(profile);
  await handlers.plan(config as string);
}

