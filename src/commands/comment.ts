import { CommandBuilder } from "yargs";
import { BaseOptions, baseOptions } from "../shared";

export const command = "comment";
export const desc = "Post comments to CI/CD pipelines";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      $0 comment github --repo <org/repo> --pull-request <pr-number> --path <path-to-baselime-output> --github-token <girhub-token>
    `]
    ])
    .commandDir("comment")
    .demandCommand()
    .strict()
};
