import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Channel } from "../../../services/api/paths/channels";

function list(channels: Channel[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ channels }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Application", "Id", "Name", "Targets", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  channels.forEach((channel) => {
    table.push([channel.application, channel.id, channel.name, JSON.stringify(channel.targets), channel.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${channels.length} channels`))}`);
}

export default {
  list,
};
