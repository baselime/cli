import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, baseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application?: string;
 }

export const command = "list [parameters]";
export const desc = "List alerts";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "application name", alias: "a" },
    })
    .example([
      ["$0 alerts list"],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile , json, application, } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile!);
  await handlers.list(!!json, application);
}
