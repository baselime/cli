import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";


export interface Options extends BaseOptions {
  path?: string;
  yes?: boolean;
}

export const command = "create";
export const desc = "Create template";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
      .options({
        ...baseOptions,
        path: {
          type: "string",
          desc: "The folder containing templates",
          alias: "c",
          default: ".templates",
        },
        yes: {
          type: "boolean",
          desc: "Skip the manual validation of changes",
          alias: "y",
          default: false,
        },
      })
      .example([
        [`
      $0 templates create --path .templates --profile prod`,
        ],
      ])
      .fail((message, err, yargs) => {
        printError(message, err, yargs);
      });
};

export async function handler(argv: Arguments<Options>) {
  const { path, profile } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.create(path!);
}