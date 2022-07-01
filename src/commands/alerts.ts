import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "alerts";
export const desc = "Manage alerts";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 alerts list
    `]
    ])
    .commandDir("alerts")
    .demandCommand()
    .strict()
};

