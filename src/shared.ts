import chalk from "chalk";

import { client, setAxiosAuth } from "./services/api/clients";
import { readUserAuth } from "./services/auth";
import * as os from "os";
import { hideBin } from "yargs/helpers";
import spinner from "./services/spinner";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { promisify } from "util";
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
  quiet: { type: "boolean", default: false },
  debug: { type: "boolean", default: false },
  endpoint: { type: "string", hidden: true },
  format: { type: "string", desc: "Format to output the data in", default: "table", choices: ["table", "json"] },
} as const;

export function userConfigNotFound(profile: string) {
  console.log(
    `${chalk.red(`You're not authenticated as ${chalk.bold(profile)}`)}
Run ${chalk.greenBright(`baselime login --profile ${chalk.cyan(`${profile}`)} to create a new profile`)}`,
  );
}

export function printError(message: string, err: Error, yargs: any) {
  if (message || err.message) {
    console.error(chalk.redBright(chalk.bold(`✖ ${err?.name ? `${err.name} -` : ""} ${message || err.message}`)));
  }

  const argv = hideBin(process.argv);

  if (!err) {
    console.log(`${yargs.help()}`);
  }

  if (err instanceof Error && (argv.includes("-d") || argv.includes("--debug"))) {
    console.log(`
  Version: ${getVersion()}
  Environment: ${os.platform()}, node ${process.version} 
  Backend: ${client.defaults.baseURL}
  Docs: docs.baselime.io
  Support: forum.baselime.io
  Bugs: github.com/baselime/cli/issues
    `);
    console.error(err);
  } else if (err) {
    console.log("Use the --debug flag to view the complete stack trace.");
  }
  process.exit(1);
}

export function getVersion() {
  return require("../package").version;
}

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

export async function retryAfterSeconds(func: Function, mili: number) {
  try {
    return await func()
  } catch(e) {
    await promisify(setTimeout)(mili)
    return await func()
  }
}