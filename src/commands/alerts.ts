import { Arguments, CommandBuilder } from "yargs";
import { authenticate, baseOptions, userConfigNotFound } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./alerts/handlers";
import { Options } from "./alerts/types";

export const command = "alerts <subcommand> [parameters]";
export const desc = "Operations on alerts";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options(baseOptions)
    .positional("subcommand", {
      type: "string",
      choices: ["list"],
    })
    .example([
      ["$0 alerts <subcommand>"],
      ["$0 alerts <subcommand>  --profile prod"],
    ]);
};

export async function handler(argv: Arguments<Options>) {
  const { subcommand, profile = "default", json } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  switch (subcommand) {
    case subCommand.list:
      await handlers.list(!!json);
      break;
    default:
      process.exit(1);
  }
}

export enum subCommand {
  list = "list",
}
