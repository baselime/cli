import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getGranularity, getTimeframe } from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import { promptCalculations, promptDatasets, promptFilters, promptFrom, promptGroupBy, promptNeedle, promptTo } from "../prompts/query";
import { prompt } from "enquirer";
import { Timeframe } from "../../../services/api/paths/alerts";
import { KeySet } from "../../../services/api/paths/keys";
import { UserConfig } from "../../../services/auth";
import { Dataset } from "../../../services/api/paths/datasets";
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

async function createRun(data: {
  format: OutputFormat;
  from: string;
  to: string;
  id: string;
  granularity?: string;
  config: UserConfig;
}) {
  const { format, from, to, id, config, granularity } = data;
  const s = spinner.get();
  const timeframe = getTimeframe(from, to);
  s.start("Running the query ");

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    queryId: id,
    timeframe,
    config,
    granularity: granularity ? getGranularity(granularity) : undefined,
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

async function getApplicableKeys(timeframe: Timeframe, datasets: string[], config: UserConfig): Promise<KeySet[]> {
  const s = spinner.get();
  s.start("Fetching keys...");
  const keys = await api.getKeys({
    datasets,
    timeframe,
    config,
  });
  s.succeed();
  return keys.filter((set) => datasets.includes(set.dataset));
}

async function getApplicableDatasets(): Promise<Dataset[]> {
  const s = spinner.get();
  s.start("Fetching your datasets...");
  const datasets = await api.datasetsList();
  s.succeed();
  return datasets;
}

async function interactive(input: { queryId: string; format: OutputFormat; from: string; to: string; granularity: string; config: UserConfig }) {
  const s = spinner.get();
  const { queryId, format, config } = input;
  let { from, to, granularity } = input;

  const applicableDatasets = await getApplicableDatasets();

  let timeframe = getTimeframe(from, to);
  let datasets = await promptDatasets(applicableDatasets);
  let applicableKeys = await getApplicableKeys(timeframe, datasets, config);

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
        datasets = await promptDatasets(applicableDatasets);
        break;
    }
    timeframe = getTimeframe(from, to);
    applicableKeys = await getApplicableKeys(timeframe, datasets, config);
  }

  let calculations = await promptCalculations(
    // only numeric
    applicableKeys.filter((keySet) => keySet.type === "number"),
  );
  let groupBys;
  let orderBy;
  let limit;
  if (calculations.length) {
    const res = await promptGroupBy(applicableKeys, calculations);
    groupBys = res?.type ? [{ value: res?.value, type: res?.type }] : undefined;
    orderBy = res?.orderBy ? { value: res?.orderBy, order: res?.order } : undefined;
    limit = res?.limit ? limit : undefined;
  }

  const filters = await promptFilters(applicableKeys);
  const needle = await promptNeedle();

  s.start("Running the query");

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    queryId,
    timeframe,
    granularity: granularity ? getGranularity(granularity) : undefined,
    parameters: {
      datasets,
      calculations,
      needle,
      filters: filters.map((filter) => ({
        ...filter,
        operation: filter.operator,
      })),
      groupBys,
      orderBy,
      limit,
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
