import { Arguments, CommandBuilder, demandOption } from "yargs";

import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import spinner from "../../services/spinner";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  name: string;
}

export const command = "describe";
export const desc = "Return the description of an application";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      name: {
        type: "string",
        desc: "Name of the application",
      },
    })
    .demandOption("name")
    .example([
      [`
      $0 applications describe --name <application_name>`
      ],
    ])
    .demandOption(["name"])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, name } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.describe(name, format!);
}

