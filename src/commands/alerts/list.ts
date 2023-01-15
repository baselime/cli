import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";

export interface Options extends BaseOptions {
  service?: string;
}

export const command = "list";
export const desc = "List all the alerts";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "Name of the service" },
    })
    .example([
      [
        `
      # List all the alerts:
      $0 alerts list

      # List all the alerts for an service:
      $0 alerts list --service <service_name>
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, format, service: service } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);
  await handlers.list(format!, service);
}
