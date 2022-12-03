import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "services";
export const desc = "Manage services";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 services list
      $0 services describe --name <service_name>
    `]
    ])
    .commandDir("services")
    .demandCommand()
    .strict()
};
