import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, printError } from "../../shared";
import spinner from "../../services/spinner/index";
import handlers from "./handlers/handlers";
import { NamespaceCombination } from "../../services/api/paths/queries";

export interface Options extends BaseOptions {
  datasets: string[];
  from: string;
  to: string;
  follow: boolean;
  namespaces: string[];
  combination: string;
}

export const command = "stream";
export const desc = `Stream a dataset`;

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      datasets: {
        type: "array",
        desc: "The datasets to stream",
        default: [],
      },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
      namespaces: { type: "array", desc: "The namespaces to stream; if no namespace is specified all namespaces will be streamed; multiple namespaces can be passed", default: [] },
      combination: { type: "string", desc: "The combination to use when multiple namespaces are specified", default: "include", choices: ["include", "exclude", "starts_with"] },
      follow: { type: "boolean", desc: "Wait for additional data to be appended when the end of streams is reached", default: false, alias: "f" },
    })
    .example([
      [`
      # Stream a dataset
      $0 stream --datasets <dataset_name> --from 3hours to now
      
      # Stream multiple namespaces in a dataset
      $0 stream --datasets <dataset_name> --namespaces <space_1> <space_2>`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, datasets, from, to, format, follow, namespaces, combination } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.stream(format, datasets, from, to, namespaces, combination.toUpperCase() as NamespaceCombination, follow);
}

