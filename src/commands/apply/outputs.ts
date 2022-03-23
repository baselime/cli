import Table from "cli-table3";
import { EOL } from "os";
import { tableChars } from "../../shared";
import chalk from "chalk";
import { Deployment } from "../../services/api/paths/polaris";

function check(deployment: Deployment, json: boolean) {
  if (json) {
    process.stdout.write(JSON.stringify({ deployment }, null, 4));
    return;
  }
  var table = new Table({
    chars: tableChars,
    head: ["id", "application", "Status", "Created", "Updated"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
    table.push([deployment.id, deployment.application, deployment.status, deployment.created, deployment.updated]);
  process.stdout.write(`${EOL}${table.toString()}${EOL}`);
}

export default {
  check,
};
