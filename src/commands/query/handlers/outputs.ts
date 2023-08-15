import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Aggregates, QueryRun, Series } from "../../../services/api/paths/query-runs";
import dayjs from "dayjs";
import outputs from "../../tail/outputs";
import { Event } from "../../../services/api/paths/events";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;

function getQueryRun(data: { queryRun: QueryRun; aggregates?: Aggregates; series: Series[]; events?: Event[]; format: OutputFormat }) {
  const { queryRun, aggregates, series, events, format } = data;

  if (format === "json") {
    console.log(JSON.stringify({ queryRun, aggregates, series, events }, null, 4));
    return;
  }

  if (!aggregates) {
    outputs.tail(events || [], format);
    return;
  }

  const isGrouped = aggregates.some((a) => a.groups) || !aggregates.length;
  const groups = isGrouped ? Object.keys(aggregates[0]?.groups || {}) : [];
  const first = aggregates[0];
  const calculationKeys = !first ? ["None"] : Object.keys(first.values).filter((k) => !["_count", "_firstSeen", "_lastSeen"].includes(k));

  const filteredAggregates = aggregates.map((agg) => {
    const values = { ...agg.values };
    // rome-ignore lint/performance/noDelete: <explanation>
    delete values["_count"];
    // rome-ignore lint/performance/noDelete: <explanation>
    delete values["_firstSeen"];
    // rome-ignore lint/performance/noDelete: <explanation>
    delete values["_lastSeen"];
    return {
      groups: agg.groups,
      values,
    };
  });

  const head = isGrouped ? ["", ...calculationKeys] : calculationKeys;
  const aggregatesTable: Table.Table = new Table({
    chars: tableChars,
    head: head.map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });

  if (isGrouped && !groups.length) {
    aggregatesTable.push(["No results for the given groupBy"]);
  } else {
    aggregatesTable.push(
      ...filteredAggregates.map((agg) => {
        const group = agg.groups ? Object.values(agg.groups).join("") : "";
        const values = Object.values(agg.values).map((v) => v.toString());
        if (group) {
          values.unshift(group);
        }
        return values;
      }),
    );
  }

  console.log();
  console.log(aggregatesTable.toString());
  console.log();
  console.log(
    `Explore the query results: https://console.${BASELIME_DOMAIN}/${queryRun.workspaceId}/${queryRun.environmentId}/${queryRun.service}/queries/${queryRun.query.id}/${queryRun.id}`,
  );
}

export default {
  getQueryRun,
};
