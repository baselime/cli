import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  name: string;
  workspaceId: string;
}

export const command = "get";
export const desc = "Retrieves the template";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      workspaceId: {
        type: "string",
        desc: "Workspace ID",
        alias: "w",
        required: true,
      },
      name: {
        type: "string",
        desc: "Name of the template",
        alias: "n",
        required: true,
      },
    })
    .example([
      [
        `
      $0 templates create --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, name, workspaceId } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.get(workspaceId, name);
}
