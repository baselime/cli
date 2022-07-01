import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "channels";
export const desc = "Manage channels";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 channels list
    `]
    ])
    .commandDir("channels")
    .demandCommand()
    .strict()
};

