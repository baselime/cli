import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import {markersCreate, markersList} from "../services/api/paths/markers";

export interface Options extends BaseOptions {

}
export const command = "markers";
export const desc = `Interact with markers API`;

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([
      [
        `foo`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  let { profile, id, from, to, format, service } = argv;
  spinner.init(!!argv.quiet);
  const config = await authenticate(profile);
  const marker = await markersCreate({
    service: "prod-api",
    name: "test",
    description: "test",
    startTime: Date.now().valueOf(),
    type: "test",
  });
  console.log('marker', marker);
  const markers = await markersList({
    service: "prod-api",
    timeframe: {
      from: 1684419715960,
      to: 1684419715970,
    }
  });
  console.log('markers', markers);
}
