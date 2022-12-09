import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Service } from "../../../services/api/paths/services";
import { Deployment } from "../../../services/api/paths/deployments";

function list(services: Service[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ services }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Name", "Created (UTC)"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  services.forEach((service) => {
    table.push([service.name, service.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${services.length} services`))}`);
}

function describe(service: Service, deployments: Deployment[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ service, deployments }, null, 4));
    return;
  }  
  const table = new Table({
    chars: tableChars,
    head: ["Name", "Status", "Deployment Id", "Created (UTC)", "Updated (UTC)"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  table.push([service.name, deployments[0].status, deployments[0].id, service.created, deployments[0].updated]);
  console.log(table.toString());
}

export default {
  list,
  describe,
};
