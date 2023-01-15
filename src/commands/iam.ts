import { Arguments, CommandBuilder } from "yargs";
import api from "../services/api/api";
import spinner from "../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import { iam } from "./auth/handlers/outputs";

export const command = "iam";
export const desc = "View authentication status";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      # Check authentication status for default profile:
      $0 iam

      # Check authentication status of a specified profiel:
      $0 iam --profile prod
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<BaseOptions>) {
  const s = spinner.init(!!argv.quiet);

  let { profile, format } = argv;

  const config = await authenticate(profile);
  s.start("Fetching your authenticated status");
  const { key, workspace, environment } = await api.getApiKeyPermissions();
  s.succeed();

  iam(profile, key, workspace, environment, config.apiKey, format);
}
