import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "telemetry";
export const desc = "Manage Baselime telemetry collection";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      $0 telemetry enable
      $0 telemetry disable
    `,
      ],
    ])
    .commandDir("telemetry")
    .demandCommand()
    .strict();
};
