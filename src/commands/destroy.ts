import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./destroy/handlers/handlers";

export interface Options extends BaseOptions {
  config?: string;
}

export const command = "destroy";
export const desc = "Destroy previously-created observability configurations";

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
      [
        `
      $0 destroy
      $0 destroy --config .baselime --profile prod`,
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

  await handlers.destroy(config!);
}
