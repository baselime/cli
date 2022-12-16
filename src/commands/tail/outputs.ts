import Table from "cli-table3";

import { OutputFormat } from "../../shared";
import chalk from "chalk";
import { Event } from "../../services/api/paths/events";
import { flatten } from "flat";

function tail(events: Event[], format: OutputFormat) {
  events.reverse().forEach((event) => {
    transformEvent(event);
    console.log(chalk.cyan(event._timestamp), chalk.magenta(event._dataset), chalk.yellow(event._namespace), JSON.stringify(event._parsed, undefined, 2));
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
  tail,
};
