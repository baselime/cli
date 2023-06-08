import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import {rehydrate} from "../services/api/paths/rehydrate";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
  "dry-run"?: boolean;
  variables?: (string | number)[];
}

export const command = "rehydrate";
export const desc = "Rehydrate expired data from your s3";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration folder to execute",
        alias: "c",
        default: ".baselime",
      },
    })
    .example([
      [
        `
      $0 rehydrate
      $0 rehydrate --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, yes, variables: vars, "dry-run": dryRun } = argv;
  spinner.init(!!argv.quiet);
  console.log("logging in");
  await authenticate(profile);
  const result = await rehydrate({
    startDate: new Date("2023-05-08T03:00:00.000Z"),
    hoursToRecover: 1,
    accountId: "097948374213",
    region: "eu-west-1",
  });
  console.log(result);
}
