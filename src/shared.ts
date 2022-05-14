import chalk from "chalk";

import { setAxiosAuth } from "./services/api/clients";
import { readUserAuth } from "./services/auth";

export interface BaseOptions {
  profile?: string;
  quiet?: boolean;
  format?: OutputFormat;
}

export type OutputFormat = "json" | "table";

export const baseOptions = {
  profile: { type: "string", default: "default" },
  quiet: { type: "boolean", default: false, },
  format: { type: "string", desc: "Format to output the data in", default: "table", choices: ["table", "json"] },
} as const;

export function userConfigNotFound(profile: string) {
  console.log(`🚩 ${chalk.red(`You're not authenticated as ${chalk.bold(profile)}`)}\nRun the following to configure ${chalk.bold(chalk.red(profile))}:\n${chalk.bold(`$ baselime auth --profile ${chalk.cyan(`${profile}`)}`)}`);
}

export function printError(err: Error, yargs: any) {
  console.log(`\n${yargs.help()}\n\n`);
  process.exit(1);
}

export async function authenticate(profile: string) {
  try {
    const config = await readUserAuth(profile);
    setAxiosAuth(config.apiKey);
  } catch (_) {
    userConfigNotFound(profile);
    process.exit(1);
  }
}

export const tableChars = {
  top: "═",
  "top-mid": "╤",
  "top-left": "╔",
  "top-right": "╗",
  bottom: "═",
  "bottom-mid": "╧",
  "bottom-left": "╚",
  "bottom-right": "╝",
  left: "║",
  "left-mid": "╟",
  mid: "─",
  "mid-mid": "┼",
  right: "║",
  "right-mid": "╢",
  middle: "│",
};
