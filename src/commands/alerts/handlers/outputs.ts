import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Alert, AlertCheck } from "../../../services/api/paths/alerts";

function list(alerts: Alert[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ alerts }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Application", "Id", "Name", "Enabled", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alerts.forEach((alert) => {
    table.push([alert.application, alert.id, alert.name, alert.enabled, alert.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${alerts.length} alerts`))}`);
}

function check(alertChecks: AlertCheck[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ alertChecks }, null, 4));
    return;
  }

  const table = new Table({
    chars: tableChars,
    head: ["Application", "Alert", "Triggered", "Threshold", "Value"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alertChecks.forEach(alertCheck => {
    table.push([alertCheck.application, alertCheck.alertId, alertCheck.triggered, `${alertCheck.calculationKey} ${alertCheck.threshold.operation} ${alertCheck.threshold.value}`, `${alertCheck.aggregates[alertCheck.calculationKey]}`]);
  })
  console.log(`${table.toString()}`);
}

export default {
  list,
  check,
};
