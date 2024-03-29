import chalk from "chalk";
import { APIKey, Environment, Workspace } from "../../../services/api/paths/auth";
import { OutputFormat, tableChars } from "../../../shared";
import Table from "cli-table3";
import { getAuthProfilePath } from "../../../services/auth";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;

export function welcome() {
  console.log(`${chalk.greenBright("Welcome to Baselime")}\n`);
  console.log(`${chalk.grey("By using the Baselime terminal you agree with our terms (https://baselime.io/terms) and our privacy policy (https://baselime.io/privacy)")}\n`);
}

export function userConfigFound(profile: string) {
  console.log(
    `You're already authenticated as ${chalk.cyan(profile)}
Run ${chalk.greenBright("baselime login --profile <new_baselime_profile_name>")} to create a new profile`,
  );
}

export function credentialsConfigured(path: string) {
  console.log(`✨ You're now logged in! Your API Key is written to ${chalk.cyan(path)}`);
  console.log(`
Next steps:
Run ${chalk.greenBright("baselime query")} to query your telemetry data`);
  process.exit(0);
}

export function iam(profile: string, key: APIKey, workspace: Workspace, environment: Environment, apiKey: string, format: OutputFormat) {
  const path = getAuthProfilePath(profile);
  if (format === "json") {
    console.log(JSON.stringify({ key, workspace, environment, path }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
  });

  table.push(["Workspace", `${workspace.id}`]);
  table.push(["Environment", `${environment.id}`]);
  table.push(["User ID", key.userId]);
  table.push(["API Key", apiKey]);
  table.push(["Path", path]);
  table.push(["Domain", BASELIME_DOMAIN]);

  console.log(table.toString());
}
