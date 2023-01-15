import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  service?: string;
}

export const command = "list";
export const desc = "List all the services";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .example([
      [
        `
      # List all the services:
      $0 services list
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list(format!);
}
