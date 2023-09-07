import { Arguments, CommandBuilder } from "yargs";
import { parseFilter } from "../regex";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import { randomString } from "../utils";
import handlers from "./query/handlers/handlers";
import { promptServiceSelect as promptServiceSelect, promptFrom, promptQuerySelect, promptTo, promptGranularity } from "./query/prompts/query";
import { getTimeframe } from "../services/timeframes/timeframes";

export interface Options extends BaseOptions {
  service?: string;
  id?: string;
  from?: string;
  granularity?: string;
  to?: string;
}
export const command = "query";
export const desc = `Run a query
Use baselime query without any flags for the interactive mode`;

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "Name of the service" },
      id: { type: "string", desc: "Query id, if running a saved query" },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now" },
      granularity: { type: "string", desc: "Size of the query result bins - may also be relative eg: 1h, 20mins" },
    })
    .example([
      [
        `
        # Run a query in interactive mode
        $0 query

        # Run a saved query passing the service name and the queryId:
        $0 query --service <service_name> --id <query_id> --from 2days --to 1day
    `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, id, from, to, granularity, format, service, "api-key": apiKey } = argv;

  spinner.init(!!argv.quiet);
  const config = await authenticate(profile, apiKey);

  service ??= (await promptServiceSelect())?.name || "";

  id ??= (await promptQuerySelect(service))?.id;

  let isSaved = true;
  if (!id) {
    isSaved = false;
    id = `baselime-new-query-${randomString(6)}`;
  }

  if (!(service && id)) {
    throw new Error("Service and query id are required");
  }

  from ??= await promptFrom();
  to ??= await promptTo();
  const timeframe = getTimeframe(from, to);
  let initialGranularity = Math.abs(timeframe.from - timeframe.to) / 60;
  granularity ??= await promptGranularity(initialGranularity);

  if (!isSaved) {
    return await handlers.interactive({
      queryId: id as string,
      service: service as string,
      format,
      from,
      granularity,
      to,
      config,
    });
  }

  await handlers.createRun({
    id,
    format,
    from,
    to,
    service: service,
    granularity,
    config,
  });
}
