import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "queries";
export const desc = "Manage queries";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 queries list
    `]
    ])
    .commandDir("queries")
    .demandCommand()
    .strict()
};
