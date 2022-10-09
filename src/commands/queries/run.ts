import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";
import { promptApplicationSelect, promptFrom, promptQuerySelect, promptTo } from "./prompts/run";

export interface Options extends BaseOptions {
  application?: string;
  id?: string;
  from?: string;
  to?: string;
}

export const command = "run";
export const desc = "Run a query";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "Name of the application", alias: "app" },
      id: { type: "string", desc: "Query id" },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now" },
    })
    .example([
      [`
      # Run a query passing its application and id:
      $0 queries run --application <application_name> --id <query_id> --from 2days --to 1day
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, format, application, from, to, id } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  application ??= (await promptApplicationSelect())?.name || "";
  id ??= (await promptQuerySelect(application))?.id || "";

  if(!application || !id) {
    throw new Error("application and query id are required");
  }

  from ??= await promptFrom();
  to ??= await promptTo();
  
  await handlers.createRun(format, from, to, application, id);
}

