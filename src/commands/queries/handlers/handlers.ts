import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import parse from 'parse-duration'
import dayjs from "dayjs";
import { OutputFormat } from "../../../shared";

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

  const now = dayjs();
  const f = now.subtract(parse(from), "milliseconds");
  const t = to === "now" ? now : now.subtract(parse(to), "milliseconds");
  const { queryRun, calculations: { aggregates, bins } } = await api.queryRunCreate({
    queryId: id,
    timeframe: {
      from: f.valueOf(),
      to: t.valueOf(),
    }
  });
  s.succeed();
  outputs.getQueryRun(queryRun, aggregates, bins, [], format);
}

export default {
  list,
  createRun,
};
