import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "templates";
export const desc = "Manage templates";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      $0 templates publish
    `,
      ],
    ])
    .commandDir("templates")
    .demandCommand()
    .strict();
};
