import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, printError } from "../../shared";
import spinner from "../../services/spinner/index";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  dataset: string;
  from: string;
  to: string;
  follow: boolean;
}

export const command = "stream";
export const desc = `Stream a dataset`;

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      dataset: {
        type: "string",
        desc: "The dataset to stream",
        default: "logs",
      },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
      follow: { type: "boolean", desc: "Wait for additional data to be appended when the end of streams is reached", default: false, alias: "f" },
    })
    .example([
      [`
      # Stream a dataset
      $0 stream --dataset <dataset_name> --from 3hours to now`,
      ],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, dataset, from, to, format, follow } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.stream(format, dataset, from, to, follow);
}

