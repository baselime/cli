import { Arguments, CommandBuilder } from "yargs";

import { BaseOptions, baseOptions, printError } from "../shared";

export interface Options extends BaseOptions {
  config?: string;
}

export const command = "plan";
export const desc = "Show changes required by the current configuration";

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
      $0 plan
      $0 plan --config .baselime --profile prod`,
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

