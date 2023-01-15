import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { baseOptions, BaseOptions, printError } from "../../shared";
import { promptForEmail, promptForOneTimePassword } from "../auth/handlers/prompts";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  provider: string;
  account: string;
  region: string;
  alias: string;
  email?: string;
}

export const command = "connect";
export const desc = "Connect a cloud environment to Baselime";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      provider: { type: "string", desc: "The cloud provider", choices: ["aws"] },
      account: { type: "string", desc: "The account number" },
      region: { type: "string", desc: "The region" },
      alias: { type: "string", desc: "An alias for the environment (eg. 'prod')" },
      email: { type: "string", desc: "Email of the user", alias: "e" },
    })
    .demandOption("provider")
    .demandOption("account")
    .demandOption("region")
    .demandOption("alias")
    .example([
      [
        `
      # Connect an AWS environment:
      $0 environments connect --provider aws --account <account_numner> --region <region> --alias <alias>
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  const { provider, account, region, alias, format } = argv;
  let { email } = argv;

  email ??= await promptForEmail();

  s.start("Sending email verification request");
  await api.generateOneTimePassword(email);
  s.succeed();

  const otp = await promptForOneTimePassword(email);

  await handlers.connect(format, provider, { account, region }, alias, otp);
}
