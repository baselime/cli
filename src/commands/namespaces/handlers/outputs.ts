import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";

function list(namespaces: { namespace: string; timestamp: string }[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ namespaces }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Namespace", "Last ingested"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  namespaces.forEach((namespace) => {
    table.push([namespace.namespace, namespace.timestamp]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${namespaces.length} namespaces`))}`);
}

export default {
  list,
};
