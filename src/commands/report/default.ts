import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import { writeFileSync } from "fs";
import { commonHandler } from "./handlers/common";

export interface Options extends BaseOptions {
  "out-file"?: string;
}

export const command = "*";
export const desc = "Post a Baselime report to file or stdout";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      "out-file": { type: "string", desc: "Path to the Baselime output file", required: false },
    })
    .example([
      [
        `
      # Post a report to stdout:
      $0 report 

      # Post a report to file:
      $0 report --out-file <path-to-baselime-output>
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, quiet, "out-file": outputFile, format, "api-key": apiKey } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile, apiKey);
  const status = await commonHandler(quiet, undefined, format);
  if (outputFile) {
    writeFileSync(outputFile, Buffer.from(JSON.stringify(status)));
  } else {
    console.log(JSON.stringify(status, undefined, 2));
  }
}
