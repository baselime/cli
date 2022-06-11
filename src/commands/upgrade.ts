import { Arguments, CommandBuilder } from "yargs";
import { baseOptions, BaseOptions, printError } from "../shared";
import { execSync } from 'child_process';
import { getLatestVersion } from "../services/api/paths/cli";
import spinner from "../services/spinner";
const packageJson = require("../../package.json");


const { BASELIME_DOMAIN = "baselime.io" } = process.env;

export const command = "upgrade";
export const desc = "Upgrades the Baselime CLI to the latest version";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [`
      # Upgrade:
      $0 upgrade
      `]
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<BaseOptions>) {
  spinner.init(!!argv.quiet);

  const { version: latestVersion } = await getLatestVersion();
  const { version } = packageJson;
  if (version === latestVersion) {
    return console.log(`You're currently using the latest version of the Baselime CLI: v${latestVersion}`);
  }
  const res = execSync(`curl https://get.${BASELIME_DOMAIN} | sh`);
  console.log(res.toString());
  console.log(`Upgraded to v${latestVersion}`);
}
