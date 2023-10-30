import Table from "cli-table3";
import * as asciichart from "asciichart";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Aggregates, QueryRun, Series } from "../../../services/api/paths/query-runs";
import dayjs from "dayjs";
import outputs from "../../tail/outputs";
import { Event } from "../../../services/api/paths/events";
import { isObjectEqual } from "../../../utils";
import { writeFileSync } from "fs";

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

  const config = {
    offset: 3, // axis offset from the left (min 2)
    padding: "       ", // padding string for label formatting (can be overrided)
    height: 15,
    colors: [asciichart.green, asciichart.blue, asciichart.cyan, asciichart.magenta, asciichart.red],
  };

  const seriesData = getChartData({ aggregates, series });
  if (seriesData.length) {
    console.log();
    const dataToPlot = seriesData[0].map((e: any) => e.data).slice(0, config.colors.length);
    console.log(asciichart.plot(dataToPlot, config));
    console.log();
    const colorize = [chalk.green, chalk.blue, chalk.cyan, chalk.magenta, chalk.red];
    seriesData[0].slice(0, config.colors.length).forEach((d, index) => {
      const name = typeof d.name === "object" ? Object.values(d.name).join(" - ") : d.name;
      console.log(` ${colorize[index](name)}`);
    });
  }
  console.log();
  console.log(`Explore the query results: https://console.${BASELIME_DOMAIN}/${queryRun.workspaceId}/${queryRun.environmentId}/queries/${queryRun.query.id}/${queryRun.id}`);
}

function getChartData(data: { aggregates?: Aggregates; series: Series[] }) {
  const toHide = ["_count", "_firstSeen", "_lastSeen"];
  const keys = data.aggregates ? Object.keys(data.aggregates[0]?.values || {}).filter((i) => !toHide.includes(i)) : [];

  if (!(keys.length && data.aggregates)) {
    return [];
  }

  const isGrouped = data.aggregates.some((c) => c.groups);
  const groupBys = Object.keys(data.aggregates[0]?.groups || {});
  const groups = groupBys.length
    ? data.aggregates.map((cal) => {
        const a = Object.keys(cal.groups || {});
        const res = {} as Record<string, any>;
        a.forEach((key) => {
          if (groupBys.some((g) => g === key)) res[key] = cal.groups?.[key];
        });
        return res;
      })
    : [];

  const seriesArray = keys.map((key) => {
    let series: { name: string | Record<string, any>; data: any[] }[];
    if (isGrouped) {
      series = groups.map((group) => {
        return {
          name: group,
          data: data.series.map((s: any) => {
            try {
              const index = s.data.findIndex((d: any) => isObjectEqual(d.groups, group));
              if (index > -1) {
                return s.data[index].aggregates[key];
              }
              return 0;
            } catch (e) {
              return 0;
            }
          }),
        };
      });
    } else {
      series = [
        {
          name: key,
          data: data.series.map((s: any) => (s.data.length ? s.data[0].aggregates[key] : 0)),
        },
      ];
    }
    return series;
  });
  return seriesArray;
}

export default {
  getQueryRun,
};
