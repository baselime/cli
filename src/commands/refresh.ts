import { Arguments, CommandBuilder } from "yargs";

import { BaseOptions, baseOptions, printError } from "../shared";

export interface Options extends BaseOptions {
  config?: string;
}

export const command = "refresh";
export const desc = "Update the state to match remote systems";

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
    })
    .example([
      [`
      $0 refresh
      $0 refresh --config .baselime --profile prod`,
      ],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile } = argv;
  console.log("Coming soon.")
}

