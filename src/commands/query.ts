import { Arguments, CommandBuilder } from "yargs";
import { parseFilter } from "../regex";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import { randomString } from "../utils";
import handlers from "./query/handlers/handlers";
import { promptFrom, promptQuerySelect, promptTo, promptGranularity } from "./query/prompts/query";
import { getTimeframe } from "../services/timeframes/timeframes";

export interface Options extends BaseOptions {
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

        # Run a saved query passing the queryId:
        $0 query --id <query_id> --from 2days --to 1day
    `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, id, from, to, granularity, format, "api-key": apiKey } = argv;

  spinner.init(!!argv.quiet);
  const config = await authenticate(profile, apiKey);

  id ??= (await promptQuerySelect())?.id;

  let isSaved = true;
  if (!id) {
    isSaved = false;
    id = `baselime-new-query-${randomString(6)}`;
  }

  if (!id) {
    throw new Error("Query id required");
  }

  from ??= await promptFrom();
  to ??= await promptTo();
  const timeframe = getTimeframe(from, to);
  let initialGranularity = Math.abs(timeframe.from - timeframe.to) / 60;
  granularity ??= await promptGranularity(initialGranularity);

  if (!isSaved) {
    return await handlers.interactive({
      queryId: id as string,
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
    granularity,
    config,
  });
}
