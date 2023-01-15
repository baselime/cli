import { Arguments, CommandBuilder } from "yargs";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";
import handlers from "./handlers/handlers";
import { promptAlertSelect, promptServiceSelect } from "./prompts/check";

export interface Options extends BaseOptions {
  service?: string;
  id?: string;
  trigger?: boolean;
}

export const command = "check";
export const desc = "Run the query of a set of alerts to check their status";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "Name of the service" },
      id: { type: "string", desc: "Id of the alert" },
      trigger: { type: "boolean", desc: "Flag to trigger the alert as part of the check" },
    })
    .example([
      [
        `
      # Check all the alerts in an service:
      $0 alerts check --service <service_name>

      # Check a specific alert:
      $0 alerts check --service <service_name> --id <alert_id>

      # Check and trigger all the alerts in an service:
      $0 alerts check --service <service_name> --trigger
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, format, service: service, id, trigger } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  service ??= (await promptServiceSelect())?.name || "";
  id ??= (await promptAlertSelect(service))?.id || "";

  if (!(service && id)) {
    throw new Error("service and alert id are required");
  }
  await handlers.check(format!, { service, id, trigger });
}
