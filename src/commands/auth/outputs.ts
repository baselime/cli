import chalk from "chalk";
import { EOL } from "os";

export function welcome() {
  process.stdout.write(`
  ${chalk.bold(chalk.greenBright("👋 Welcome to Baselime"))}

  Observability for serverless

  ${EOL}`);
}

export function userConfigFound(profile: string) {
  process.stdout.write(`
  You're already authenticated as ${chalk.cyan(profile)} 👌
  If you would like to configure a new profile, run the following:

  ${chalk.bold(`$ baselime auth --profile ${chalk.cyan("new_profile_name")}`)}

  ${EOL}`);
}

export function credentialsConfigured(path: string) {
  process.stdout.write(`✨ API Key written to ${chalk.cyan(path)}`);
  process.exit(0);
}
