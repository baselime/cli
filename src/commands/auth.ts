import ora from "ora";
import { Arguments, CommandBuilder } from "yargs";

import api from "../services/api/api";
import { baseOptions } from "../shared";
import * as prompts from "./auth/prompts";
import * as outputs from "./auth/outputs";
import { readUserConfig, writeUserConfig } from "../services/config";
import { Options } from "./auth/types";
import { EOL } from "os";

export const command = "auth";
export const desc = "Authenticate a user";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      email: { type: "string", desc: "user email", alias: "e" },
    })
    .example([["$0 auth"], ["$0 auth --email hi@example.com --profile prod"]]);
};

export async function handler(argv: Arguments<Options>) {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { email, profile = "default" } = argv;

  outputs.welcome();

  try {
    const config = await readUserConfig(profile);
    outputs.userConfigFound(profile);
  } catch (_) {}

  const accountEmail = email ?? (await prompts.promptForEmail());

  spinner.start(`Sending email verification request ${EOL}`);
  await api.generateOneTimePassword(accountEmail);
  spinner.succeed();

  const otp = await prompts.promptForOneTimePassword(accountEmail);

  spinner.start("Checking your environments");
  const workspaces = await api.getWorkspacesByOneTimePassword(otp);
  spinner.succeed();

  const { workspaceId, environmentId } = await prompts.promptForEnvironment(
    workspaces,
  );

  spinner.start("Setting up your workstation");
  const apiKey = await api.getApiKey(workspaceId, environmentId, otp);

  const path = await writeUserConfig(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  spinner.succeed();

  outputs.credentialsConfigured(path);
}
