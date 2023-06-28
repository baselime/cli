import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import api from "../services/api/api";

export interface Options extends BaseOptions {
  config?: string;
  query?: string;
}

export const command = "search";
export const desc = "search through your baselime resources";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration folder to execute",
        alias: "c",
        default: ".baselime",
      },
      query: { type: "string", desc: "Query to search for your resources" },
    })
    .example([
      [
        `
      $0 search --query serviceFoo
      $0 search --config .baselime --profile prod --query serviceFoo`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, query } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  const s = spinner.get();
  s.start("Searching");
  if(!query) {
    throw new Error("Missing query");
  }
  const result = await api.search({
    query: query,
  });
  s.succeed();
  console.log(JSON.stringify(result));
}
