import { Arguments, CommandBuilder } from "yargs";
import { getMetadata } from "../services/parser/parser";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./status/handlers";

export interface Options extends BaseOptions {
  config?: string;
  "out-file": string;
  application?: string;
}

export const command = "status";
export const desc = "Runs all the alerts in the current application, displays the results and outputs them to a file";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration folder to execute",
        alias: "c",
        default: ".baselime",
      },
      "out-file": {
        type: "string",
        desc: "The file to output the results to",
        alias: "o",
        default: "baselime-status.json",
      },
      "application": {
        type: "string",
        desc: "The application to check the status",
        alias: "app",
      },
    })
    .example([
      [`
      $0 status
      $0 status --config .baselime --out-file file.json`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile, "out-file": outFile, format } = argv;
  let { application } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  application = application || (await getMetadata(config!)).application;

  await handlers.status(format!, { application, outFile })
}

