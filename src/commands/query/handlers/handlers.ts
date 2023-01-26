import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import chalk from "chalk";
import { QueryFilter } from "../../../services/api/paths/queries";
import { promptCalculations, promptDatasets, promptFilters, promptFrom, promptGroupBy, promptNeedle, promptTo } from "../prompts/query";
import { prompt } from "enquirer";
import { Timeframe } from "../../../services/api/paths/alerts";
import { KeySet } from "../../../services/api/paths/keys";
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

async function createRun(data: {
  format: OutputFormat;
  datasets: string[];
  filters: QueryFilter[];
  needle?: string;
  from: string;
  to: string;
  id: string;
  follow: boolean;
  service: string;
  matchCase: boolean;
  regex?: string;
}) {
  const { format, datasets, filters, needle, from, to, follow, matchCase, regex, service, id } = data;
  const s = spinner.get();
  const timeframe = getTimeframe(from, to);
  const f = dayjs.utc(timeframe.from);
  const t = dayjs.utc(timeframe.to);
  const timeFormat = f.isSame(t, "day") ? "HH:mm:ss" : "YYYY-MM-DDTHH:mm:ss";
  s.start(`Running the query from ${chalk.bold(f.format(timeFormat))} to ${chalk.bold(t.format(timeFormat))} [UTC]`);

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    service: service,
    queryId: id,
    timeframe,
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

async function getApplicableKeys(timeframe: Timeframe, datasets: string[]): Promise<KeySet[]> {
  const s = spinner.get();
  s.start("Getting keys");
  const keys = await api.getKeys({
    environmentId: "prod",
    workspaceId: "baselime",
    params: {
      datasets,
      timeframe,
      service: "default",
    },
  });
  s.succeed();
  return keys.filter((set) => datasets.includes(set.dataset));
}

async function interactive(input: { queryId: string; service: string; format: any }) {
  const s = spinner.get();
  const { queryId, service, format } = input;

  let from = await promptFrom();

  let to = await promptTo();
  let timeframe = getTimeframe(from, to);
  let datasets = await promptDatasets();
  let applicableKeys = await getApplicableKeys(timeframe, datasets);

  while (!applicableKeys.length) {
    const choices: Record<string, string> = {
      "Start time": "from",
      "End time": "to",
      Datasets: "dataset",
    };
    const { toChange } = await prompt<{ toChange: string }>({
      type: "select",
      name: "toChange",
      min: 1,
      message: "No indexed data has been found for given dataset in the time bracket. Would you like to change the following?",
      choices: Object.keys(choices),
      result: (value: string): string => choices[value],
    });

    switch (toChange) {
      case "from":
        from = await promptFrom();
        break;
      case "to":
        to = await promptTo();
        break;
      case "dataset":
        datasets = await promptDatasets();
        break;
    }
    timeframe = getTimeframe(from, to);
    applicableKeys = await getApplicableKeys(timeframe, datasets);
  }

  let calculations = await promptCalculations(
    // only numeric
    applicableKeys.filter((keySet) => keySet.type === "number"),
  );
  let groupBy;
  if (calculations.length) {
    groupBy = await promptGroupBy(applicableKeys, calculations);
  }

  const filters = await promptFilters(applicableKeys);
  const needle = await promptNeedle();

  const f = dayjs.utc(timeframe.from);
  const t = dayjs.utc(timeframe.to);
  const timeFormat = f.isSame(t, "day") ? "HH:mm:ss" : "YYYY-MM-DDTHH:mm:ss";

  s.start(`Running the query from ${chalk.bold(f.format(timeFormat))} to ${chalk.bold(t.format(timeFormat))} [UTC]`);

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    service,
    queryId,
    timeframe,
    parameters: {
      datasets,
      calculations,
      needle,
      filters: filters.map((filter) => ({
        ...filter,
        operation: filter.operator,
      })),
      groupBy,
    },
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

export default {
  createRun,
  interactive,
};
