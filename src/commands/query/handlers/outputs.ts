import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { QueryRun, Series } from "../../../services/api/paths/query-runs";
import dayjs from "dayjs";
import outputs from "../../tail/outputs";
import { Event } from "../../../services/api/paths/events";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;


function getQueryRun(data: { queryRun: QueryRun, aggregates?: Record<string, number | Record<string, number>>, series: Series[], events?: Event[], format: OutputFormat }) {
  const { queryRun, aggregates, series, events, format } = data;

  if (format === "json") {
    console.log(JSON.stringify({ queryRun, aggregates, series, events }, null, 4));
    return;
  }

  if (!aggregates) {
    outputs.tail(events || [], format);
    return;
  }

  let aggregatesTable: Table.Table;
  const isGrouped = typeof aggregates._count !== "number";
  const calculationKeys = Object.keys(aggregates).filter(k => k !== "_count")
  if (isGrouped) {
    const groups = Object.keys(aggregates._count);
    aggregatesTable = new Table({
      chars: tableChars,
      head: ["", ...calculationKeys].map((e) => `${chalk.bold(chalk.cyan(e))}`),
    });

    if(!groups.length) {
      aggregatesTable.push(["No results for the given groupBy"]);
    }

    groups.forEach(group => {
      const vals = calculationKeys.map(key => (aggregates as Record<string, Record<string, number>>)[key][group])
      aggregatesTable.push([group, ...vals]);
    });
  } else {
    aggregatesTable = new Table({
      chars: tableChars,
      head: [...calculationKeys].map((e) => `${chalk.bold(chalk.cyan(e))}`),
    });

    aggregatesTable.push(calculationKeys.map(key => (aggregates as Record<string, number>)[key]));
  }

  console.log();
  console.log(aggregatesTable.toString());
  console.log();
  console.log(`Explore the query results: https://console.${BASELIME_DOMAIN}/${queryRun.workspaceId}/${queryRun.environmentId}/${queryRun.service}/queries/${queryRun.query.id}/${queryRun.id}`);
}

export default {
  getQueryRun,
};
