import { Arguments, CommandBuilder } from "yargs";
import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner";
import { Options } from "./query";
import { explain, askAI } from "./explain/explain";
import { prompt } from "enquirer";
import chalk from "chalk";

export const command = "explain";
export const desc = "Explain system errors";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
        # Explain all all the errors happening in the telemetry data
        $0 baselime explain
    `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, openAIKey } = argv;

  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await explain();
}
