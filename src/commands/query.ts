import { Arguments, CommandBuilder } from "yargs";
import { parseFilter } from "../regex";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import { randomString } from "../utils";
import handlers from "./query/handlers/handlers";
import { promptServiceSelect as promptServiceSelect, promptFrom, promptQuerySelect, promptTo, promptRunSavedQuery } from "./query/prompts/query";

export interface Options extends BaseOptions {
  service?: string;
  id?: string;
  from?: string;
  to?: string;
  datasets: string[];
  follow: boolean;
  filters: string[];
  calculations: string[];
  needle?: string;
  regex?: string;
  "match-case": boolean;
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

      datasets: {
        type: "array",
        desc: "The datasets to query",
        default: [],
      },
      filters: { type: "array", desc: "A set of filters to apply when running the query; multiple filters can be passed", default: [] },
      calculations: { type: "array", desc: "A set of calculations to claculations to compute; multiple calculations can be added", default: [] },
      needle: { type: "string", desc: "A string to search in the fields and values of every event" },
      regex: {
        type: "string",
        desc: "A regular expression to search in the fields and valies of every event. If there is both a needle and a regex, the regex is considered in priority",
      },
      "match-case": { type: "boolean", desc: "Match case if a needle is specified", default: false },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now" },
    })
    .example([
      [
        `
        # Run a query in interactive mode
        $0 query

        # Run a saved query passing the service name and the queryId:
        $0 query --service <service_name> --id <query_id> --from 2days --to 1day

        # Run a query inline with filters and searching for a field or value (needle)
        $0 query --filters "<key> <operation> <value>" --needle <needle> --follow
        
        # Run a query inline with a calculation on events matching a regular expression
        $0 query --calculations <operator>(<key>) --regex <regex>
    `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, id, datasets, filters, from, to, format, follow, needle, "match-case": matchCase, regex, service } = argv;

  spinner.init(!!argv.quiet);
  await authenticate(profile);

  service ??= (await promptServiceSelect())?.name || "";

  const isSaved = id ? true : await promptRunSavedQuery();
  if (isSaved) {
    id ??= (await promptQuerySelect(service))?.id || "";
  } else {
    id ??= `new-query-${randomString(6)}`;
  }

  if (!(service && id)) {
    throw new Error("service and query id are required");
  }

  const fs = filters.map(parseFilter);

  if (!isSaved) {
    return await handlers.interactive({
      // id,
      // format,
      // datasets,
      // filters: fs,
      // needle,
      // matchCase,
      // regex,
      // follow,
      queryId: id as string,
      service: service as string,
      format
    });
  }

  from ??= await promptFrom();
  to ??= await promptTo();

  await handlers.createRun({
    id,
    format,
    datasets,
    filters: fs,
    from,
    to,
    needle,
    matchCase,
    regex,
    follow,
    service: service,
  });
}
