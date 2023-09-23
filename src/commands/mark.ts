import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import * as open from "open";
import handlers from "./mark/handlers";

export interface Options extends BaseOptions {
  service: string;
  url?: string;
  name?: string;
  description?: string;
  metadata?: string;
  "start-time"?: number;
  "end-time"?: number;
  type?: string;
}

export const command = "mark";
export const desc = "Creates a marker";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "The service to add the marker to", default: "default" },
      url: {
        type: "string",
        desc: "The URL associated with the marker",
      },
      name: {
        type: "string",
        desc: "The name of the marker",
        default: "created-by-baselime-cli",
      },
      description: {
        type: "string",
        desc: "The description of the marker",
      },
      metadata: {
        type: "string",
        desc: "JSON object metadata of the marker",
      },
      "start-time": {
        type: "number",
        desc: "The start time for the marker in unix time (milliseconds since the epoch). Defaults to now",
      },
      "end-time": {
        type: "number",
        desc: "The end time for the marker in unix time (milliseconds since the epoch)",
      },
    })
    .example([
      [
        `
      # Creates a marker
      baselime mark --service <service_name> --url <marker_url> --description <description> --metadata <json-object>
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, url, name, description, metadata, "start-time": endTime, "end-time": startTime, type, format, service, "api-key": apiKey } = argv;

  spinner.init(!!argv.quiet);
  await authenticate(profile, apiKey);

  await handlers.mark({
    format,
    service,
    url,
    name,
    description,
    metadata,
    startTime,
    endTime,
    type,
  });
}
