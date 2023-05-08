import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import { promptCalculations, promptDatasets, promptFilters, promptFrom, promptGroupBy, promptNeedle, promptTo } from "../prompts/query";
import { prompt } from "enquirer";
import { Timeframe } from "../../../services/api/paths/alerts";
import { KeySet } from "../../../services/api/paths/keys";
import { UserConfig } from "../../../services/auth";
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

async function createRun(data: {
  format: OutputFormat;
  from: string;
  to: string;
  id: string;
  service: string;
  config: UserConfig
}) {
  const { format, from, to, service, id, config } = data;
  const s = spinner.get();
  const timeframe = getTimeframe(from, to);
  s.start("Running the query ");

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    service: service,
    queryId: id,
    timeframe,
    config
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

async function getApplicableKeys(timeframe: Timeframe, datasets: string[], service: string): Promise<KeySet[]> {
  const s = spinner.get();
  s.start("Fetching keys...");
  const keys = await api.getKeys({
    datasets,
    timeframe,
    service,
  });
  s.succeed();
  return keys.filter((set) => datasets.includes(set.dataset));
}

async function interactive(input: { queryId: string; service: string; format: OutputFormat; from: string; to: string, config: UserConfig }) {
  const s = spinner.get();
  const { queryId, service, format, config } = input;
  let { from, to } = input;

  let timeframe = getTimeframe(from, to);
  let datasets = await promptDatasets();
  let applicableKeys = await getApplicableKeys(timeframe, datasets, service);

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
      message: "No indexed data has been found for given datasets in the time bracket. Select different parameters.",
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
    applicableKeys = await getApplicableKeys(timeframe, datasets, service);
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

  s.start("Running the query");

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
    config,
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

export default {
  createRun,
  interactive,
};
