import { Arguments, CommandBuilder } from "yargs";

import api from "../services/api/api";
import { baseOptions } from "../shared";
import * as prompts from "./auth/prompts";
import * as outputs from "./auth/outputs";
import { readUserConfig, writeUserConfig } from "../services/config";
import { Options } from "./auth/types";
import spinner from "../services/spinner/index";
import { EOL } from "os";

export const command = "auth";
export const desc = "Authenticate a user";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      email: { type: "string", desc: "user email", alias: "e" },
    })
    .example([
      ["$0 auth"],
      ["$0 auth --email hi@example.com --profile prod"]
    ]);
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  const { email, profile = "default" } = argv;

  outputs.welcome();

  try {
    const config = await readUserConfig(profile);
    if (config) {
      outputs.userConfigFound(profile);
      const res = await prompts.promptReplaceExistingConfig(profile);
      if (!res) {
        process.exit(0);
      }
    }
  } catch (_) { }

  const accountEmail = email ?? (await prompts.promptForEmail());

  s.start(`Sending email verification request ${EOL}`);
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

  const path = await writeUserConfig(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();

  outputs.credentialsConfigured(path);
}
