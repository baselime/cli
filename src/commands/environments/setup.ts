import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { BaseOptions, printError } from "../../shared";
import { promptForEmail, promptForOneTimePassword } from "../auth/handlers/prompts";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  type: string;
  account: string;
  region: string;
  alias: string;
  email?: string;
}

export const command = "setup";
export const desc = "Setup a new environment";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      type: { type: "string", desc: "The type of environment to setup", choices: ["aws"] },
      account: { type: "string", desc: "The account number", },
      region: { type: "string", desc: "The region", },
      alias: { type: "string", desc: "An alias for the environment (eg. 'prod')", },
      email: { type: "string", desc: "Email of the user", alias: "e" },
    })
    .demandOption("type")
    .demandOption("account")
    .demandOption("region")
    .demandOption("alias")
    .example([
      [`
      # Setup an AWS environment:
      $0 environments setup --type aws --account <account_numner> --region <region> --alias <alias>
      `],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  const { type, account, region, alias, format} = argv;
  let { email } = argv;
 
  email ??= (await promptForEmail());

  s.start(`Sending email verification request`);
  await api.generateOneTimePassword(email);
  s.succeed();

  const otp = await promptForOneTimePassword(email);

  await handlers.setup(format, type, { account , region }, alias, otp);

}
