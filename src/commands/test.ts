import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./test/handlers";

export interface Options extends BaseOptions {
  "out-file": string;
}

export const command = "test";
export const desc = "Test all the alerts, displays the results in the terminal, and outputs them to a file";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      "out-file": { type: "string", desc: "The file to output the results to", alias: "o", default: "baselime-snapshot.json" },
    })
    .example([
      [
        `
      $0 test
      $0 test --out-file file.json`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile, "out-file": outFile, format, "api-key": apiKey } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile, apiKey);

  await handlers.test(format!, { outFile });
}
