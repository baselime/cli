import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import chalk from "chalk";
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)


async function createRun(format: OutputFormat, from: string, to: string, application: string, id: string) {
  const s = spinner.get();
  const timeframe = getTimeframe(from, to);
  const f = dayjs.utc(timeframe.from);
  const t = dayjs.utc(timeframe.to);
  const timeFormat = f.isSame(t, "day") ? "HH:mm:ss" : "YYYY-MM-DDTHH:mm:ss";
  s.start(`Running the query from ${chalk.bold(f.format(timeFormat))} to ${chalk.bold(t.format(timeFormat))} [UTC]`);

  const { queryRun, calculations: { aggregates, series } } = await api.queryRunCreate({
    application,
    queryId: id,
    timeframe,
  });
  s.succeed();
  outputs.getQueryRun(queryRun, aggregates, series, [], format);
}

export default {
  createRun,
};
