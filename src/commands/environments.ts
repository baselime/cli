import { CommandBuilder } from "yargs";
import { baseOptions } from "../shared";
import { BaseOptions } from "vm";

export const command = "environments";
export const desc = "Manage environments";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 environments connect
    `]
    ])
    .commandDir("environments")
    .demandCommand()
    .strict()
};

