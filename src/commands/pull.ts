import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./pull/handlers";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
}

export const command = "pull";
export const desc = "Pull the state from the remote systems to update the local state";

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
      yes: {
        type: "boolean",
        desc: "Skip the manual validation of changes",
        alias: "y",
        default: false,
      },
    })
    .example([
      [`
      $0 pull
      $0 pull --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile, yes } = argv;
  await authenticate(profile);
  await handlers.pull(config!, yes!);
}

