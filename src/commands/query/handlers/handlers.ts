import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import chalk from "chalk";
import { QueryFilter } from "../../../services/api/paths/queries";
import {promptCalculations, promptDatasets, promptFrom, promptTo} from "../prompts/query";
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

async function interactive(input: {queryId: string, service: string, format: any}) {
  const s = spinner.get();

  const {queryId, service, format} = input;

  const from = await promptFrom();
  const to = await promptTo();
  const timeframe = getTimeframe(from, to);
  const f = dayjs.utc(timeframe.from);
  const t = dayjs.utc(timeframe.to);

  const datasets = await promptDatasets();

  s.start("Getting keys");
  const keys = await api.getKeys({
    environmentId: "prod",
    workspaceId: "baselime",
    params: {
      timeframe,
      service: "default"
    }
  });
  s.succeed();
  const applicableKeys = keys
      .filter(set => datasets.includes(set.dataset))
      .map(set => set.keys)
      .flat();
  if (!applicableKeys.length) {
    s.info("no data exists");
  }
  const calculations = await promptCalculations(applicableKeys);

  const timeFormat = f.isSame(t, "day") ? "HH:mm:ss" : "YYYY-MM-DDTHH:mm:ss";
  s.start(`Running the query from ${chalk.bold(f.format(timeFormat))} to ${chalk.bold(t.format(timeFormat))} [UTC]`);

  const {
    queryRun,
    calculations: { aggregates, series },
    events: { events, count },
  } = await api.queryRunCreate({
    service,
    calculations,
    datasets,
    queryId,
    timeframe,
    workspace: "baselime"
  });
  s.succeed();
  outputs.getQueryRun({ queryRun, aggregates, series, events, format });
}

export default {
  createRun,
  interactive
};
