import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import { writeFileSync } from "fs";
import { commonHandler } from "./handlers/common";

export interface Options extends BaseOptions {
  "out-file"?: string;
  service?: string;
  config?: string;
}

export const command = "*";
export const desc = "Post a Baselime report to file or stdout";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      "out-file": { type: "string", desc: "Path to the Baselime output file", required: false },
      config: {
        type: "string",
        desc: "The configuration folder to create the report for. This will be used to determine the service if no service is provided.",
        alias: "c",
        default: ".baselime",
      },
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
  const { profile, config, quiet, "out-file": outputFile, format, "api-key": apiKey } = argv;
  let { service } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile, apiKey);
  const status = await commonHandler(quiet, undefined, config, service, format);
  if (outputFile) {
    writeFileSync(outputFile, Buffer.from(JSON.stringify(status)));
  } else {
    console.log(JSON.stringify(status, undefined, 2));
  }
}
