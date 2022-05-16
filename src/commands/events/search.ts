import { BaseOptions } from "vm";
import { Arguments, CommandBuilder } from "yargs";

import {  printError } from "../../shared";


export const command = "search";
export const desc = `Search for a needle in a dataset`;

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .example([
      [`
      $0 events search`,
      ],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<BaseOptions>) {
  const { profile } = argv;
  console.log("Coming soon.")
}

