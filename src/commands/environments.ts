import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

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

