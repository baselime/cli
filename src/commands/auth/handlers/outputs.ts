import chalk from "chalk";
import { APIKey, Environment, Workspace } from "../../../services/api/paths/auth";
import { OutputFormat, tableChars } from "../../../shared";
import Table from "cli-table3";


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

export function status(key: APIKey, workspace: Workspace, environment: Environment, format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ key, workspace, environment }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Workspace", "Environment", "userId"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  table.push([`${workspace.name} (id: ${workspace.id})`, `${environment.alias} (alias: ${environment.id})`, key.userId,]);

  const permissionsTable = new Table({
    chars: tableChars,
    head: ["Permission", "Value",].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  Object.keys(key.permissions).sort().map(k => {
    permissionsTable.push([k, (key.permissions as any)[k]]);
  })

  console.log(table.toString());
  console.log(permissionsTable.toString());
}
