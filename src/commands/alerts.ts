import { CommandBuilder } from "yargs";
import { baseOptions } from "../shared";
import { BaseOptions } from "vm";

export const command = "alerts <command> [parameters]";
export const desc = "Operations on alerts";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .commandDir("alerts")
    .strict()
};

