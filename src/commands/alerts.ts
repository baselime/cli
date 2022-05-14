import { CommandBuilder } from "yargs";
import { baseOptions } from "../shared";
import { BaseOptions } from "vm";

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

