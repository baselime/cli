import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";
import { baseOptions, BaseOptions, printError } from "../shared";
import * as open from "open";

export interface Options extends BaseOptions {
  email?: string;
  profile: string;
}

export const command = "console";
export const desc = "Open the baselime web console";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `
      # Open the Baselime webconsole with the CLI
      baselime console
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  let { endpoint } = argv;

  const { BASELIME_DOMAIN = "baselime.io" } = process.env;

  const loginUrl = `https://console.${endpoint || BASELIME_DOMAIN}`;
  await open.default(loginUrl);
}
