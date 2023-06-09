import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import api from "../services/api/api";
import { promptSelectAccount } from "./rehydrate/prompts";

export interface Options extends BaseOptions {
  config?: string;
  startDate?: string;
  hoursToRecover?: number;
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
      startDate: { type: "string", desc: "Date onwards which to recover the data ISO format" },
      hoursToRecover: { type: "number", desc: "Consecutive hours of data from startDate to recover" },
    })
    .example([
      [
        `
      $0 rehydrate --startDate 2023-06-08T13:24:47.906Z --hoursToRecover 1
      $0 rehydrate --config .baselime --profile prod --startDate 2023-06-08T13:24:47.906Z --hoursToRecover 1`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, startDate, hoursToRecover } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  const sd = new Date(startDate as string);
  if (isNaN(sd.valueOf())) {
    throw new Error("Invalid Date");
  }
  const htr = Number(hoursToRecover);
  if (isNaN(htr) || htr < 1 || htr > 12) {
    throw new Error("Invalid hoursToRecover");
  }
  const account = await promptSelectAccount();
  const s = spinner.get();
  s.start("Requesting rehydration");
  const result = await api.rehydrate({
    startDate: sd,
    hoursToRecover: htr,
    accountId: account.id,
    region: account.region,
  });
  s.succeed();
}
