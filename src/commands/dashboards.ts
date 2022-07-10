import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "dashboards";
export const desc = "Manage dashboards";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 dashboards list
    `]
    ])
    .commandDir("dashboards")
    .demandCommand()
    .strict()
};

