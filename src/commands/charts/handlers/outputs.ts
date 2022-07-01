import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Chart } from "../../../services/api/paths/charts";

function list(charts: Chart[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ charts }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Id", "Application", "Ref", "Name", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  charts.forEach((channel) => {
    table.push([channel.id, channel.application, channel.ref, channel.name, channel.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${charts.length} charts`))}`);
}

export default {
  list,
};
