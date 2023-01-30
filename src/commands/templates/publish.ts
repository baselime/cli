import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  path?: string;
  url?: string;
  yes?: boolean;
}

export const command = "publish";
export const desc = "Publish one or multiple templates";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      url: {
        type: "string",
        desc: "The URL containing templates",
      },
      path: {
        type: "string",
        desc: "The folder containing templates",
      },
      recurse: {
        type: "boolean",
        desc: "Recurse directory to find any baselime templates",
        default: false,
      },
      yes: {
        type: "boolean",
        desc: "Skip the manual validation of changes",
        alias: "y",
        default: false,
      },
    })
    .example([
      [
        `
      $0 templates publish --path .templates --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { path, url, profile, recurse } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.publish(path, url, !!recurse);
}
