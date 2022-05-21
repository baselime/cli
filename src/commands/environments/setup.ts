import { Arguments, CommandBuilder } from "yargs";
import { BaseOptions, printError } from "../../shared";

export interface Options extends BaseOptions {
  type?: string;
  account?: string;
  region?: string;
  alias?: string;
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
  const { type, account, region, alias, } = argv;
  console.log("Coming soon.")
}
