import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "charts";
export const desc = "Manage charts";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 charts list
    `]
    ])
    .commandDir("charts")
    .demandCommand()
    .strict()
};

