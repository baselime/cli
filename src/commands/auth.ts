import { Arguments, CommandBuilder } from "yargs";

import api from "../services/api/api";
import { BaseOptions, baseOptions, printError } from "../shared";
import * as prompts from "./auth/handlers/prompts";
import * as outputs from "./auth/handlers/outputs";
import { readUserAuth, writeUserAuth } from "../services/auth";
import spinner from "../services/spinner/index";

export interface Options extends BaseOptions {
  email?: string;
}

export const command = "auth";
export const desc = "Authenticate a user";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      email: { type: "string", desc: "user email", alias: "e" },
    })
    .example([["$0 auth"], ["$0 auth --email hi@example.com --profile prod"]])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  const { email, profile } = argv;

  outputs.welcome();

  try {
    const config = await readUserAuth(profile!);
    if (config) {
      outputs.userConfigFound(profile!);
      const res = await prompts.promptReplaceExistingProfile(profile!);
      if (!res) {
        process.exit(0);
      }
    }
  } catch (_) {}

  const accountEmail = email ?? (await prompts.promptForEmail());

  s.start(`Sending email verification request`);
  await api.generateOneTimePassword(accountEmail);
  s.succeed();

  const otp = await prompts.promptForOneTimePassword(accountEmail);

  s.start("Checking your environments");
  const workspaces = await api.getWorkspacesByOneTimePassword(otp);
  s.succeed();

  const { workspaceId, environmentId } = await prompts.promptForEnvironment(
    workspaces,
  );

  s.start("Setting up your workstation");
  const apiKey = await api.getApiKey(workspaceId, environmentId, otp);

  const path = await writeUserAuth(profile!, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();

  outputs.credentialsConfigured(path);
}
