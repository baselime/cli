import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./query/handlers/handlers";
import { promptServiceSelect as promptServiceSelect, promptFrom, promptQuerySelect, promptTo } from "./query/prompts/query";

export interface Options extends BaseOptions {
  service?: string;
  id?: string;
  from?: string;
  to?: string;
}
export const command = "query";
export const desc = "Run a query";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "Name of the service" },
      id: { type: "string", desc: "Query id" },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now" },
    })
    .example([
      [`
        # Run a query in interactive mode
        $0 query

        # Run a query passing its service and id:
        $0 query --service <service_name> --id <query_id> --from 2days --to 1day
    `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, format, service: service, from, to, id } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  service ??= (await promptServiceSelect())?.name || "";
  id ??= (await promptQuerySelect(service))?.id || "";

  if(!service || !id) {
    throw new Error("service and query id are required");
  }

  from ??= await promptFrom();
  to ??= await promptTo();
  
  await handlers.createRun(format, from, to, service, id);
}

