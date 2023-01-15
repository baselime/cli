import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "namespaces";
export const desc = "Manage namespaces";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      $0 namespaces list
    `,
      ],
    ])
    .commandDir("namespaces")
    .demandCommand()
    .strict();
};
