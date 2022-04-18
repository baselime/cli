import { Arguments, CommandBuilder } from "yargs";

import { authenticate, baseOptions } from "../shared";
import spinner from "../services/spinner/index";
import { readFileSync } from "fs";
import { Options } from "./apply/types";
import yaml from "yaml";
import handlers from "./apply/handlers";
import chalk from "chalk";

export const command = "apply [subcommand]";
export const desc = "Executes changes to the observability configs";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "config file",
        alias: "c",
        default: ".baselime.yml",
      },
      id: {
        type: "string",
        desc: "deployment id",
      },
    })
    .positional("subcommand", {
      type: "string",
      choices: ["check"],
    })
    .example([
      ["$0 apply"],
      ["$0 apply --config .baselime.yml --profile prod"],
    ])
    .fail((msg, err, yargs) => {
      console.log(`${yargs.help()}\n\n`);
      console.error(`${chalk.redBright("baselime: error:")} ${err.message}`);
      process.exit(1);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { subcommand, id = "", config = ".baselime.yml", profile = "default", json } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);

  const file = readFileSync(config).toString();
  const { version, application } = yaml.parse(file);

  if (subcommand) {

    switch (subcommand) {
      case subCommand.check: {
        if (!id) {
          throw new Error("The following arguments are required: --id");
        }
        await handlers.check(application, id, !!json);
        break;
      }
      default:
        process.exit(1);
    }
    return;
  }

  await handlers.apply(file, application, version);
}


export enum subCommand {
  check = "check",
}
