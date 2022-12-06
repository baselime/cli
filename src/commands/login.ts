import { Arguments, CommandBuilder } from "yargs";
import api from "../services/api/api";
import { readUserAuth, writeUserAuth } from "../services/auth";
import spinner from "../services/spinner";
import { baseOptions, BaseOptions, printError } from "../shared";
import { credentialsConfigured, userConfigFound, welcome } from "./auth/handlers/outputs";
import { promptForEmail, promptForEnvironment, promptForOneTimePassword, promptReplaceExistingProfile } from "./auth/handlers/prompts";


export interface Options extends BaseOptions {
  email?: string;
  profile: string;
}

export const command = "login";
export const desc = "Obtain and save credentials for an environment";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      email: { type: "string", desc: "Email of the user", alias: "e" },
      profile: { type: "string", desc: "Alias of the profile", default: "default" },
    })
    .example([
      [`
      # Intercatively authenticate against Baselime:
      $0 login

      # Provide parameters on the command-line:
      $0 login --email hi@bob.lol --profile prod
      `]
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  let { email, profile } = argv;

  welcome();

  try {
    const config = await readUserAuth(profile);
    if (config) {
      userConfigFound(profile);
      const res = await promptReplaceExistingProfile(profile);
      if (!res) {
        process.exit(0);
      }
    }
  } catch (_) { }

  email ??= (await promptForEmail());

  s.start(`Sending email verification request`);
  await api.generateOneTimePassword(email);
  s.succeed();

  const otp = await promptForOneTimePassword(email);

  s.start("Checking your environments");
  const workspaces = await api.getWorkspacesByOneTimePassword(otp);
  s.succeed();

  const { workspaceId, environmentId } = await promptForEnvironment(workspaces);

  s.start("Setting up your workstation");
  const apiKey = await api.getApiKey(workspaceId, environmentId, otp);

  const path = await writeUserAuth(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();

  credentialsConfigured(path);
}
