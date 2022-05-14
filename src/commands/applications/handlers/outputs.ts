import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Application } from "../../../services/api/paths/applications";
import { Deployment } from "../../../services/api/paths/deployments";

function list(applications: Application[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ applications }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Name", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  applications.forEach((application) => {
    table.push([application.name, application.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${applications.length} applications`))}`);
}

function describe(application: Application, deployments: Deployment[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ application, deployments }, null, 4));
    return;
  }  
  const table = new Table({
    chars: tableChars,
    head: ["Name", "Status", "Deployment Id", "Created", "Updated"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  table.push([application.name, deployments[0].status, deployments[0].id, application.created, deployments[0].updated]);
  console.log(table.toString());
}

export default {
  list,
  describe,
};
