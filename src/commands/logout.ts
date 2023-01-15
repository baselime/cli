import { Arguments, CommandBuilder } from "yargs";
import { deleteUserAuth } from "../services/auth";
import spinner from "../services/spinner";
import { baseOptions, BaseOptions, printError } from "../shared";

export interface Options extends BaseOptions {
  profile: string;
}

export const command = "logout";
export const desc = "Remove locally-stored credentials for an environment";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      profile: { type: "string", desc: "Alias of the profile", default: "default" },
    })
    .example([
      [
        `
      # Intercatively select the environment to log out of:
      $0 logout

      # Provide parameters on the command-line:
      $0  logout --profile prod
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);
  const { profile } = argv;
  s.start("Deleting credentials from your workstation");
  deleteUserAuth(profile);
  s.succeed("Deleted credentials from your workstation");
}
