import { BaseOptions } from "vm";
import { Arguments, CommandBuilder } from "yargs";
import { deleteUserAuth } from "../../services/auth";
import spinner from "../../services/spinner";
import { printError } from "../../shared";



export interface Options extends BaseOptions {
  profile: string;
}

export const command = "logout";
export const desc = "Remove locally-stored credentials for an environment";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      profile: { type: "string", desc: "Alias of the profile", default: "default" },
    })
    .example([
      [`
      # Intercatively select the environment to log out of:
      $0 auth logout

      # Provide parameters on the command-line:
      $0 auth logout --profile prod
      `]
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);
  const { profile } = argv;
  s.start("Deleting credentials from your workstation");
  deleteUserAuth(profile);
  s.succeed("Deleted credentials from your workstation");
}
