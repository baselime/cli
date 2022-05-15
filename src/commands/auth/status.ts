import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import { readUserAuth, writeUserAuth } from "../../services/auth";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import { credentialsConfigured, status, userConfigFound, welcome } from "./handlers/outputs";
import { promptForEmail, promptForEnvironment, promptForOneTimePassword, promptReplaceExistingProfile } from "./handlers/prompts";

export const command = "status";
export const desc = "View authentication status";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      # Check authentication status for default profile:
      $0 auth status

      # Check authentication status of a specified profiel:
      $0 auth status --profile prod
      `]
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<BaseOptions>) {
  const s = spinner.init(!!argv.quiet);

  let { profile, format } = argv;

  await authenticate(profile);
  s.start("Fetching your authenticated status");
  const { key, workspace, environment } = await api.getApiKeyPermissions();
  s.succeed();

  status(key, workspace, environment, format);
}
