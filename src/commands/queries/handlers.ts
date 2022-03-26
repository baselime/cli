import spinner from "../../services/spinner/index";
import api from "../../services/api/api";
import outputs from "./outputs";
import parse from 'parse-duration'
import dayjs from "dayjs";

async function list(json: boolean, application?: string) {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = await api.queriesList(application);
  s.succeed();
  outputs.list(queries, json);
}

async function createRun(json: boolean, id: string, from: string, to: string) {
  const now = dayjs();
  const f = now.subtract(parse(from), "milliseconds");
  const t = to === "now" ? now : now.subtract(parse(to), "milliseconds");
  const s = spinner.get();
  s.start("Running the query");
  const { queryRun, calculations: { aggregates, bins } } = await api.queryRunCreate({
    queryId: id,
    timeframe: {
      from: f.valueOf(),
      to: t.valueOf(),
    }
  });
  s.succeed();
  outputs.getQueryRun(queryRun, aggregates, bins, [], json);
}

export default {
  list,
  createRun,
};
