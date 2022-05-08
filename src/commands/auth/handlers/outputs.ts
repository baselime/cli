import chalk from "chalk";


export function welcome() {
  console.log(`${chalk.bold(chalk.greenBright("Welcome to Baselime"))}\n`);
}

export function userConfigFound(profile: string) {
  console.log(`You're already authenticated as ${chalk.cyan(profile)} 👌\n\nIf you would like to configure a new profile, run the following:\n${chalk.bold(`$ baselime auth --profile ${chalk.cyan("<new_profile_name>")}`)}\n`);
}

export function credentialsConfigured(path: string) {
  console.log(`✨ API Key written to ${chalk.cyan(path)}`);
  process.exit(0);
}
