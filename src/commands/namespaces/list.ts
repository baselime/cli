import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  datasets: string[];
  from: string;
  to: string;
}

export const command = "list";
export const desc = "List all the ingested namespaces";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      datasets: { type: "array", desc: "The datasets", default: [] },
      from: { type: "string", desc: "UTC start time - may also be relative eg: 1h, 20mins", default: "1hour" },
      to: { type: "string", desc: "UTC end time - may also be relative eg: 1h, 20mins, now", default: "now" },
    })
    .example([
      [`
      # List all the namespaces ingested in the 'logs; dataset for the past hour:
      $0 namespaces list

      # List all the namespaces ingested in the <dataset> datasets in the past 3 hours:
      $0 namespaces list --datasets <dataset> --from 3hours --to now
      `],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, from, to, datasets } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list(format!, datasets, from, to);
}
