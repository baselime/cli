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
      $0 queries run --id <query_id> --from <from> --to <to> --format json
    `]
    ])
    .commandDir("queries")
    .demandCommand()
    .strict()
};
