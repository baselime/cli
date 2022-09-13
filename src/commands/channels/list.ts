import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application?: string;
}

export const command = "list";
export const desc = "List all the channels";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      application: { type: "string", desc: "Name of the application", alias: "app" },
    })
    .example([
      [`
      # List all the channels:
      $0 channels list

      # List all the channels for an application:
      $0 channels list --application <application_name>
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, application, } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list(format!, application);
}
