import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "queries <command> [parameters]";
export const desc = "Operations on queries";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .commandDir("queries")
    .strict()
};
