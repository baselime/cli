import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "events";
export const desc = "Manage events";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 events stream
    `]
    ])
    .commandDir("events")
    .demandCommand()
    .strict()
};
