import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";

async function list(format: OutputFormat, application?: string) {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = await api.queriesList(application);
  s.succeed();
  outputs.list(queries, format);
}

async function createRun(format: OutputFormat, from: string, to: string, application: string, id: string) {
  const s = spinner.get();
  s.start("Running the query");

  const { queryRun, calculations: { aggregates, series } } = await api.queryRunCreate({
    application,
    queryId: id,
    timeframe: getTimeframe(from, to),
  });
  s.succeed();
  outputs.getQueryRun(queryRun, aggregates, series, [], format);
}

export default {
  list,
  createRun,
};
