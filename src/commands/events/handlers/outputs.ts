import Table from "cli-table3";

import { OutputFormat } from "../../../shared";
import chalk from "chalk";
import { Event } from "../../../services/api/paths/events";

function stream(events: Event[], format: OutputFormat) {
  events.reverse().forEach((event) => {
    console.log(chalk.cyan(event._timestamp), chalk.green(event._dataset), chalk.yellow(event._namespace), event._source);
  });
}

export default {
  stream,
};
