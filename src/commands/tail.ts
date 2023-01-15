import { Arguments, CommandBuilder } from "yargs";

import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./tail/handlers";
import { parseFilter } from "../regex";

export interface Options extends BaseOptions {
  datasets: string[];
  from: string;
  to: string;
  follow: boolean;
  filters: string[];
  needle?: string;
  regex?: string;
  "match-case": boolean;
  service?: string;
}

export const command = "tail";
export const desc = "Tail your telemetry data to your terminal";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      datasets: {
        type: "array",
        desc: "The datasets to tail",
        default: [],
      },
      service: { type: "string", desc: "The service to tail. When specified, additional filters are combined with the filters of the service" },
      filters: { type: "array", desc: "A set of filters to apply to the tail; multiple filters can be passed", default: [] },
      needle: { type: "string", desc: "A string to search in the telemetry data to tail" },
      regex: { type: "string", desc: "A regular expression to search in the telemetry data to tail. If there is both a needle and a regex, the regex takes priority" },
      "match-case": { type: "boolean", desc: "Match case if a needle is specified", default: false },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
      follow: { type: "boolean", desc: "Wait for additional data to be appended when the end of the tail is reached", default: false, alias: "f" },
    })
    .example([
      [
        `
      # Tail a dataset
      $0 tail --datasets <dataset_name> --from 3hours to now

      # Tail all datasets with filters and find a needle
      $0 tail --filters "<key> <operation> <value>" --needle "<needle>" --follow
      
      # Tail all datasets with filters and find all events matching a regular expression
      $0 tail --filters "<key> <operation> <value>" --regex "<regex>" --follow`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, datasets, filters, from, to, format, follow, needle, "match-case": matchCase, regex, service } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  const fs = filters.map(parseFilter);
  await handlers.tail({
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
