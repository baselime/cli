import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application?: string;
}

export const command = "list";
export const desc = "List all the dashboards";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      application: { type: "string", desc: "Name of the application", alias: "app" },
    })
    .example([
      [`
      # List all the dashboards:
      $0 dashboards list

      # List all the dashboards for an application:
      $0 dashboards list --application <application_name>
      `],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, application, } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list(format!, application);
}
