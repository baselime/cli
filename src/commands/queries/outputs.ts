import { Query } from "../../services/api/paths/queries";
import Table from "cli-table3";
import { EOL } from "os";
import { tableChars } from "../../shared";
import chalk from "chalk";

function list(queries: Query[], json: boolean) {
  if (json) {
    process.stdout.write(JSON.stringify({ queries }, null, 4));
    return;
  }
  var table = new Table({
    chars: tableChars,
    head: ["id", "Name", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  queries.forEach((query) => {
    table.push([query.id, query.name, query.created]);
  });
  process.stdout.write(`${EOL}${table.toString()}${EOL}`);
  process.stdout.write(
    `${EOL}✨ ${chalk.bold(chalk.cyan(`${queries.length} queries${EOL}`))}`,
  );
}

export default {
  list,
};
