import Table from "cli-table3";

import chalk from "chalk";
import { Deployment } from "../../../services/api/paths/polaris";
import { tableChars } from "../../../shared";

function check(deployment: Deployment, json: boolean) {
  if (json) {
    console.log(JSON.stringify({ deployment }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["id", "application", "Status", "Created", "Updated"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  table.push([deployment.id, deployment.application, deployment.status, deployment.created, deployment.updated]);
  console.log(table.toString());
}

export default {
  check,
};
