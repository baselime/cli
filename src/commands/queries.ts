import { Arguments, CommandBuilder } from "yargs";
import { authenticate, baseOptions, printError, userConfigNotFound } from "../shared";
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
      id: { type: "string", desc: "id", },
      from: { type: "string", desc: "start of the query", },
      to: { type: "string", desc: "end of the query", },
    })
    .positional("subcommand", {
      type: "string",
      choices: ["list", "run"],
    })
    .example([
      ["$0 queries <subcommand>"],
      ["$0 queries <subcommand>  --profile prod"],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { subcommand, profile = "default", json, application, id, from, to } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  switch (subcommand) {
    case subCommand.list:
      await handlers.list(!!json, application);
      break;
    case subCommand.run:
      const args: Record<string, boolean> = {
        id: !!id,
        from: !!from,
        to: !!to,
      }
      if (Object.values(args).some(v => v === false)) {
        const keys = Object.keys(args).filter(a => args[a] === false)
        throw new Error(`the following arguments are required: ${keys.map(key => `--${key}`)}`);
      }
      await handlers.createRun(!!json, id!, from!, to!);
      break;
    default:
      process.exit(1);
  }
}

export enum subCommand {
  list = "list",
  run = "run",
}
