import Table from "cli-table3";

import { OutputFormat } from "../../shared";
import chalk from "chalk";
import { Event } from "../../services/api/paths/events";

function tail(events: Event[], format: OutputFormat, field?: string) {
  events.reverse().forEach((event) => {
    let display = event._parsed;
    if (field) {
      display = findNestedKey(event._parsed, field);
    }
    console.log(chalk.cyan(event._timestamp), chalk.magenta(event._dataset), chalk.yellow(event._service), chalk.green(event._namespace), JSON.stringify(display, undefined, 2));
  });
}

function findNestedKey(obj: any, keyString: string) {
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (error) {
      return undefined;
    }
  }
  const keys = keyString.split(".");
  let val = obj;
  for (let i = 0; i < keys.length; i++) {
    val = val[keys[i]];
    if (val === undefined) {
      return undefined;
    }
  }
  return val;
}

export default {
  tail,
};
