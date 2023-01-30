import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import { startServer, PORT } from "../../services/auth/server";
import spinner from "../../services/spinner";
import { baseOptions, BaseOptions, printError } from "../../shared";
import { promptAWSAccountId, promptAWSRegion, promptEnvironmentAlias, promptForEmail, promptForOneTimePassword } from "../auth/handlers/prompts";
import handlers from "./handlers/handlers";
import * as open from "open";
import chalk from "chalk";

export interface Options extends BaseOptions {
  provider?: string;
  account?: string;
  region?: string;
  alias?: string;
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
    })
    .example([
      [
        `
      # Connect an AWS environment:
      $0 environments connect
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  let { provider = "aws", account, region, alias, format } = argv;

  let oathData = { id_token: "", otp: "" };
  s.start("Redirecting to the browser...");
  const config = await api.getAuthConfig();
  const creds = await startServer(config, oathData.otp, argv);

  const loginUrl = `${config.url}/oauth2/authorize?client_id=${config.client}&response_type=code&scope=email+openid+phone+profile&redirect_uri=http://localhost:${PORT}`;
  await open.default(loginUrl);

  oathData.id_token = (await creds.getCreds()).id_token;
  const user = await creds.getUser();
  s.succeed(`Welcome ${user.forname || "baselimer"}!`);

  alias ??= await promptEnvironmentAlias();
  account ??= await promptAWSAccountId();
  region ??= await promptAWSRegion();

  s.start("Fetching your workspaces");
  const workspaces = await api.getWorkspaces(oathData.id_token, oathData.otp);
  s.succeed();

  if (!workspaces.length) {
    console.log(`Use ${chalk.greenBright("baselime login")} to create a workspace before connecting your ${provider} account.`);
    return process.exit(0);
  }

  await handlers.connect(format, workspaces[0].id, provider, { account, region }, alias, oathData.id_token);
}
