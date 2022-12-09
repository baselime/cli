import { Query } from "../../../services/api/paths/queries";
import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";

function list(queries: Query[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ queries }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Service", "Id", "Name", "Created (UTC)"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  queries.forEach((query) => {
    table.push([query.service, query.id, query.name, query.created]);
  });
  console.log(table.toString());
  console.log(`✨ ${chalk.bold(chalk.cyan(`${queries.length} queries`))}`);
}

export default {
  list,
};
