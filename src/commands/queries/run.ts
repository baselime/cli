import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application?: string;
  ref?: string;
  id?: string;
  from?: string;
  to?: string;
}

export const command = "run";
export const desc = "Run a query";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      application: { type: "string", desc: "Name of the application", alias: "app" },
      ref: { type: "string", desc: "Query reference", },
      id: { type: "string", desc: "Query id", },
      from: { type: "string", desc: "Start time of the query run - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "End time of the query run - may also be relative eg: 1h, 20mins, now", default: "now" },
    })
    .example([
      [`
      # Run a query passing its id:
      $0 queries run --id <query_id> --from 3hours --to now

      # Run a query passing its application and ref:
      $0 queries run --application <application_name> --ref <query_ref> --from 2days --to 1day
      `],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, application, from, to, id, ref } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile!);
  await handlers.createRun(format!, from!, to!, id, application, ref);
}

