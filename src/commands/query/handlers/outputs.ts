import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { QueryRun, Series } from "../../../services/api/paths/query-runs";
import dayjs from "dayjs";
import outputs from "../../events/stream/outputs";
import { Event } from "../../../services/api/paths/events";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;


function getQueryRun(data: { queryRun: QueryRun, aggregates?: Record<string, number | Record<string, number>>, series: Series[], events?: Event[], format: OutputFormat }) {
  const { queryRun, aggregates, series, events, format } = data;

  if (format === "json") {
    console.log(JSON.stringify({ queryRun, aggregates, series, events }, null, 4));
    return;
  }

  if (!aggregates) {
    outputs.stream(events || [], format);
    return;
  }

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

  console.log();
  console.log(aggregatesTable.toString());
  console.log();
  console.log(`Explore the query results at this unique and permanent snapshot url: https://console.${BASELIME_DOMAIN}/${queryRun.workspaceId}/${queryRun.environmentId}/${queryRun.service}/queries/${queryRun.query.id}/${queryRun.id}`);
}

export default {
  getQueryRun,
};
