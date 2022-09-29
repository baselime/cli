import Table from "cli-table3";

import { OutputFormat } from "../../../shared";
import chalk from "chalk";
import { Event } from "../../../services/api/paths/events";
import { flatten } from "flat";

function stream(events: Event[], format: OutputFormat) {
  events.reverse().forEach((event) => {
    transformEvent(event);
    console.log(chalk.cyan(event._timestamp), chalk.green(event._dataset), chalk.yellow(event._namespace), event._parsed);
  });
}

export function transformEvent(event: Event): Event {
  try {
    event._source = JSON.parse(event._source.replace(/\\'/g, `'`));
    event._parsed = flatten.unflatten(event._source);
  } catch (error) {
    event._parsed = event._source;
  }
  return event;
}

export default {
  stream,
};
