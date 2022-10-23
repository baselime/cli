import { Query } from "../../../services/api/paths/queries";
import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { QueryRun, Series } from "../../../services/api/paths/query-runs";
import dayjs from "dayjs";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;

function list(queries: Query[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ queries }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["Application", "Id", "Name", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  queries.forEach((query) => {
    table.push([query.application, query.id, query.name, query.created]);
  });
  console.log(table.toString());
  console.log(`✨ ${chalk.bold(chalk.cyan(`${queries.length} queries`))}`);
}

function getQueryRun(queryRun: QueryRun, aggregates: Record<string, number | Record<string, number>>, series: Series[], events: Event[], format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify({ queryRun, aggregates, series, events }, null, 4));
    return;
  }
  const runTable = new Table({
    chars: tableChars,
    head: ["Id", "QueryId", "From", "To", "Status", "Created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });

  runTable.push([queryRun.id, queryRun.query.id, `${dayjs(queryRun.timeframe.from).format()}`, `${dayjs(queryRun.timeframe.to).format()}`, queryRun.status, queryRun.created]);

  let aggregatesTable: Table.Table;
  const isGrouped = typeof aggregates._count !== "number";
  if (isGrouped) {
    const groups = Object.keys(aggregates._count);
    const calculationKeys = Object.keys(aggregates).filter(k => k !== "_count")
    aggregatesTable = new Table({
      chars: tableChars,
      head: ["", ...calculationKeys].map((e) => `${chalk.bold(chalk.cyan(e))}`),
    });

    groups.forEach(group => {
      const vals = calculationKeys.map(key => (aggregates as Record<string, Record<string, number>>)[key][group])
      aggregatesTable.push([group, ...vals]);
    });
  } else {
    aggregatesTable = new Table({
      chars: tableChars,
      head: ["Aggregate", "Value"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
    });

    Object.keys(aggregates).forEach((key: string) => {
      if (key === "_count") return;
      aggregatesTable.push([key, (aggregates as Record<string, number>)[key]]);
    });
  }

  console.log(runTable.toString());
  console.log(aggregatesTable.toString());
  console.log(`Follow this url: https://console.${BASELIME_DOMAIN}/${queryRun.workspaceId}/${queryRun.environmentId}/${queryRun.application}/queries/${queryRun.query.id}/${queryRun.id}`)
}

export default {
  list,
  getQueryRun,
};
