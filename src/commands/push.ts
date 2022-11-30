import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./push/handlers/handlers";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
}

export const command = "push";
export const desc = "Create or update observability configurations";

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
      $0 push
      $0 push --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, yes } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);

  await handlers.push(config!, yes!);
}

