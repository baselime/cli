import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "applications <command> [args]";
export const desc = "Manage applications";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 applications list
      $0 applications describe --name <application_name>
    `]
    ])
    .commandDir("applications")
    .strict()
};
