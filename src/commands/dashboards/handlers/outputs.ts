import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Dashboard } from "../../../services/api/paths/dashboards";

function list(charts: Dashboard[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ charts }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Application", "Id", "Name", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  charts.forEach((channel) => {
    table.push([channel.application, channel.id, channel.name, channel.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${charts.length} dashboards`))}`);
}

export default {
  list,
};
