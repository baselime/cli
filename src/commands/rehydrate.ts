import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import api from "../services/api/api";
import { promptSelectAccount } from "./rehydrate/prompts";

export interface Options extends BaseOptions {
  "start-date"?: string;
  "hours-to-recover"?: number;
}

export const command = "rehydrate";
export const desc = "Rehydrate Baselime hot storage with data from your Amazon S3 Bucket";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      "start-date": { type: "string", desc: "Date to start recovering data from, in ISO format" },
      "hours-to-recover": { type: "number", desc: "Number of consecutive hours of data to recover starting from start-date. Minimum: 1, maximum: 12" },
    })
    .example([
      [
        `
      $0 rehydrate --start-date 2023-06-08T13:24:47.906Z --hours-to-recover 1
      $0 rehydrate --profile prod --start-date 2023-06-08T13:24:47.906Z --hours-to-recover 9`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, "start-date": startDate, "hours-to-recover": hoursToRecover } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  const sd = new Date(startDate as string);
  if (isNaN(sd.valueOf())) {
    throw new Error("Invalid Start date");
  }
  const htr = Number(hoursToRecover);
  if (isNaN(htr) || htr < 1 || htr > 12) {
    throw new Error("Invalid number of hours to recover");
  }
  const account = await promptSelectAccount();
  const s = spinner.get();
  s.start("Requesting data rehydration");

  await api.rehydrate({
    startDate: sd,
    hoursToRecover: htr,
    accountId: account.id,
    region: account.region,
  });
  s.succeed("Rehydration started");
}
