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

async function createRun(format: OutputFormat, from: string, to: string, id?: string, application?: string, ref?: string) {
  const s = spinner.get();
  s.start("Running the query");

  if (!id) {
    if (!application || !ref) {
      throw new Error(`The following arguments are required: --id or --application and --ref`);
    }
    id = (await api.queriesList(application, ref))[0].id;
  }


  const { queryRun, calculations: { aggregates, series } } = await api.queryRunCreate({
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
