import chalk from "chalk";
import { EOL } from "os";
import { setAxiosAuth } from "./services/api/clients";
import { readUserConfig } from "./services/config";

export interface BaseOptions {
  profile?: string;
  quiet?: boolean;
  "api-key"?: string;
  json?: boolean;
}

export const baseOptions = {
  profile: { type: "string", default: "default" },
  "api-key": { type: "string" },
  quiet: { type: "boolean", default: false, alias: "q" },
  json: { type: "boolean", default: false, conflicts: "output" },
} as const;

export function userConfigNotFound(profile: string) {
  process.stdout.write(`
  🚩 ${chalk.red(`You're not authenticated as ${chalk.bold(profile)}`)}
  Run the following to configure ${chalk.bold(chalk.red(profile))}:

  ${chalk.bold(`$ baselime auth --profile ${chalk.cyan(`${profile}`)}`)}

  ${EOL}`);
}

export async function authenticate(profile: string) {
  try {
    const config = await readUserConfig(profile);
    setAxiosAuth(config.apiKey);
  } catch (_) {
    userConfigNotFound(profile);
    process.exit(1);
  }
}
