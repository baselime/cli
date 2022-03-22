import { Arguments, CommandBuilder } from "yargs";
import { authenticate, baseOptions, userConfigNotFound } from "../shared";
import { Options } from "./queries/types";
import handlers from "./queries/handlers";
import spinner from "../services/spinner/index";

export const command = "queries <subcommand> [parameters]";
export const desc = "Operations on queries";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "application name", alias: "a" },
    })
    .positional("subcommand", {
      type: "string",
      choices: ["list", "create"],
    })
    .example([
      ["$0 queries <subcommand>"],
      ["$0 queries <subcommand>  --profile prod"],
    ]);
};

export async function handler(argv: Arguments<Options>) {
  const { subcommand, profile = "default", json, application } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  switch (subcommand) {
    case subCommand.list:
      await handlers.list(!!json, application);
      break;
    case subCommand.create:
      console.log("create");
      break;
    default:
      process.exit(1);
  }
}

export enum subCommand {
  list = "list",
  create = "create",
}
