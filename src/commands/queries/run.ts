import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application: string;
  id: string;
  from: string;
  to: string;
}

export const command = "run";
export const desc = "Run a query";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      application: { type: "string", desc: "Name of the application", alias: "app", required: true },
      id: { type: "string", desc: "Query id", required: true, },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
    })
    .example([
      [`
      # Run a query passing its application and id:
      $0 queries run --application <application_name> --id <query_id> --from 2days --to 1day
      `],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, application, from, to, id } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.createRun(format, from, to, application, id);
}

