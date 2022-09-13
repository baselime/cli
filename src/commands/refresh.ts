import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./refresh/handlers";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
}

export const command = "refresh";
export const desc = "Update the state to match remote systems";

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
      $0 refresh
      $0 refresh --config .baselime --profile prod`,
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
  await handlers.refresh(config!, yes!);
}

