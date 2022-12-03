import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Alert } from "../../../services/api/paths/alerts";
import { AlertCheck } from "../../../services/api/paths/alert-checks";

function list(alerts: Alert[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ alerts }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Service", "Id", "Name", "Enabled", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alerts.forEach((alert) => {
    table.push([alert.service, alert.id, alert.name, alert.enabled, alert.created]);
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
    head: ["Service", "Alert", "Triggered", "Threshold", "Value"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alertChecks.forEach(alertCheck => {
    const res = alertCheck.aggregates[alertCheck.calculationKey];
    const isGrouped = typeof res !== "number";
    table.push([alertCheck.service, alertCheck.alertId, alertCheck.triggered, `${alertCheck.calculationKey} ${alertCheck.threshold.operation} ${alertCheck.threshold.value}`, `${isGrouped ? JSON.stringify(res, undefined, 2) : res}`]);
  })
  console.log(`${table.toString()}`);
}

export default {
  list,
  check,
};
