import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, BaseOptions, baseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  application?: string;
  ref?: string;
  id?: string;
  from?: string;
  to?: string;
}

export const command = "run [parameters]";
export const desc = "Runs queries";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "application name", alias: "a" },
      ref: { type: "string", desc: "query reference", },
      id: { type: "string", desc: "id", },
      from: { type: "string", desc: "start of the query run", default: "1hour" },
      to: { type: "string", desc: "end of the query run", default: "to" },
    })
    .example([
      ["$0 queries run"],
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, json, application, from, to, id, ref } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile!);
  await handlers.createRun(!!json, from!, to!, id, application, ref);
}

