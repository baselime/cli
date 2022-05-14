import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "auth";
export const desc = "Manage authentication state";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .example([
      [`
      $0 auth login
      $0 auth logout
    `]
    ])
    .commandDir("auth")
    .demandCommand()
    .strict()
};
