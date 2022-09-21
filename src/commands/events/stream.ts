import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, printError } from "../../shared";
import spinner from "../../services/spinner/index";
import handlers from "./handlers/handlers";
import { NamespaceCombination } from "../../services/api/paths/queries";
import { parseFilter } from "../../utils";

export interface Options extends BaseOptions {
  datasets: string[];
  from: string;
  to: string;
  follow: boolean;
  namespaces: string[];
  combination: string;
  filters: string[];
  needle?: string;
  regex?: string;
  "match-case": boolean;
  application?: string;
}

export const command = "stream";
export const desc = `Stream telemetry data to your terminal`;

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      datasets: {
        type: "array",
        desc: "The datasets to stream",
        default: [],
      },
      application: { type: "string", desc: "The application to stream. When specified, additional filters and namespaces are combined with the filters of the application", alias: "app" },
      filters: { type: "array", desc: "A set of filters to apply to the stream; multiple filters can be passed", default: [] },
      needle: { type: "string", desc: "A string to search in the stream" },
      regex: { type: "string", desc: "A regular expression to search in the stream. If there's both a needle and a regex, the regex takes priority" },
      "match-case": { type: "boolean", desc: "Match case if a needle is specified", default: false },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
      namespaces: { type: "array", desc: "The namespaces to stream; if no namespace is specified all namespaces are streamed; multiple namespaces can be passed", default: [] },
      combination: { type: "string", desc: "The combination to use when multiple namespaces are specified", default: "include", choices: ["include", "exclude", "starts_with"] },
      follow: { type: "boolean", desc: "Wait for additional data to be appended when the end of streams is reached", default: false, alias: "f" },
    })
    .example([
      [`
      # Stream a dataset
      $0 stream --datasets <dataset_name> --from 3hours to now

      # Stream all datasets with filters and find a needle
      $0 stream --filters "<key> <operation> <value>" --needle "<needle>" --follow
      
      # Stream all datasets with filters and find all events matching a regular expression
      $0 stream --filters "<key> <operation> <value>" --regex "<regex>" --follow
      
      
      # Stream multiple namespaces in a dataset
      $0 stream --datasets <dataset_name> --namespaces <space_1> <space_2>`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, datasets, filters, from, to, format, follow, namespaces, combination, needle, "match-case": matchCase, regex, application } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  const fs = filters.map(parseFilter);
  await handlers.stream({
    format,
    datasets,
    filters: fs,
    from,
    to,
    namespaces,
    needle,
    matchCase,
    regex,
    combination: combination.toUpperCase() as NamespaceCombination,
    follow,
    application
  });
}

