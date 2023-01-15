import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {}

export const command = "list";
export const desc = "Lists all templates";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      $0 templates create --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list();
}
