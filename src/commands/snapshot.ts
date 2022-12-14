import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import { validateMetadata } from "./push/handlers/validators";
import handlers from "./snapshot/handlers";

export interface Options extends BaseOptions {
  config?: string;
  "out-file": string;
  service?: string;
}

export const command = "snapshot";
export const desc = "Runs all the alerts in the current service, create snapshots of the results, displays the results in the terminal, and outputs them to a file";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: { type: "string", desc: "The configuration folder of the service to snapshot. Defaults to the service specified in the .baselime folder, if it exists.", alias: "c", default: ".baselime", },
      "out-file": { type: "string", desc: "The file to output the results to", alias: "o", default: "baselime-snapshot.json", },
      "service": { type: "string", desc: "The service to snapshot. This will be used to determine the service if no service is provided.", },
    })
    .example([
      [`
      $0 snapshot
      $0 snapshot --config .baselime --out-file file.json`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile, "out-file": outFile, format } = argv;
  let { service } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  service = service || (await validateMetadata(config!)).service;

  await handlers.snapshot(format!, { service, outFile })
}

