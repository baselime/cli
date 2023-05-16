import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Alert } from "../../../services/api/paths/alerts";
import { AlertCheck } from "../../../services/api/paths/alert-checks";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;

function list(alerts: Alert[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ alerts }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Service", "Id", "Name", "Enabled", "Created (UTC)"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alerts.forEach((alert) => {
    table.push([alert.service, alert.id, alert.name, alert.enabled, alert.created]);
  });
  console.log(`${table.toString()}`);
  console.log(`✨ ${chalk.bold(chalk.cyan(`${alerts.length} alerts`))}`);
}

function test(alertChecks: AlertCheck[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ alertChecks }, null, 4));
    return;
  }

  const table = new Table({
    chars: tableChars,
    head: ["", "Alert"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  alertChecks.forEach((alertCheck) => {
    const res = alertCheck.aggregates[alertCheck.calculationKey];
    const isGrouped = typeof res !== "number";
    const colorize = alertCheck.triggered ? chalk.red : chalk.green;

    const url = `https://console.${BASELIME_DOMAIN}/${alertCheck.workspaceId}/${alertCheck.environmentId}/${alertCheck.service}/alerts/${alertCheck.alertId}/${alertCheck.id}`;
    table.push([
      alertCheck.triggered ? "🔴" : "🟢",
      `${colorize(alertCheck.alertId)}\n\Threshold: ${alertCheck.calculationKey} ${alertCheck.threshold.operation} ${alertCheck.threshold.value}\n${colorize(
        "Received: ",
      )}${colorize(isGrouped ? JSON.stringify(res, undefined, 2) : res)}\n\n${url}`,
    ]);
  });
  console.log(`${table.toString()}`);
}

export default {
  list,
  test,
};
