import chalk from "chalk";

import { client, setAxiosAuth } from "./services/api/clients";
import { readUserAuth } from "./services/auth";
import * as os from "os";
import { hideBin } from "yargs/helpers";
import spinner from "./services/spinner";
import { existsSync, mkdirSync, writeFileSync } from "fs";
export interface BaseOptions {
  profile: string;
  quiet: boolean;
  format: OutputFormat;
  debug: boolean;
  endpoint?: string;
}

export type OutputFormat = "json" | "table";

export const baseOptions = {
  profile: { type: "string", default: "default" },
  quiet: { type: "boolean", default: false, },
  debug: { type: "boolean", default: false, alias: "d" },
  endpoint: { type: "string", hidden: true },
  format: { type: "string", desc: "Format to output the data in", default: "table", choices: ["table", "json"] },
} as const;

export function userConfigNotFound(profile: string) {
  console.log(`${chalk.red(`You're not authenticated as ${chalk.bold(profile)}`)}\nRun the following to configure ${chalk.bold(chalk.red(profile))}:\n${chalk.bold(`$ baselime login --profile ${chalk.cyan(`${profile}`)}`)}`);
}

export function printError(message: string, err: Error, yargs: any) {
  if (message || err.message) {
    console.error(chalk.redBright(chalk.bold(message || err.message)));
  }
  console.log(chalk.grey(`
Version: ${getVersion()}
Environment: ${os.platform()}, node ${process.version} 
Backend: ${client.defaults.baseURL}
Docs: docs.baselime.io
Support: forum.baselime.io
Bugs: github.com/baselime/cli/issues
  `));
  const argv = hideBin(process.argv);
  if (err instanceof Error && (argv.includes("-d") || argv.includes("--debug"))) {
    console.error(err);
  } else {
    console.log(chalk.bold("Use the --debug flag to view the complete stack trace."))
  }
  console.log(`${yargs.help()}`);
  process.exit(1);
}

export function getVersion() { return require('../package').version; }

export async function authenticate(profile: string) {
  try {
    const config = await readUserAuth(profile);
    setAxiosAuth(config.apiKey);
    return config;
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

export const blankChars = {
  top: "",
  "top-mid": "",
  "top-left": "",
  "top-right": "",
  bottom: "",
  "bottom-mid": "",
  "bottom-left": "",
  "bottom-right": "",
  left: "",
  "left-mid": "",
  mid: "",
  "mid-mid": "",
  right: "",
  "right-mid": "",
  middle: "",
};

export function writeOutFile(folder: string, metadata: Record<string, any>, resources: Record<string, any>) {
  const s = spinner.get();

  const dir = `${folder}/.out`;
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
    writeFileSync(`${dir}/.baselime.json`, JSON.stringify({ ...metadata, resources }, null, 2));
  } catch (error) {
    const m = `folder: ${folder} - failed to create out file`;
    s.fail(chalk.bold(chalk.red("Validation error")));
    console.log(m);
    throw new Error(m);
  }
}
