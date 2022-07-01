import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat, application?: string) {
  const s = spinner.get();
  s.start("Fetching your charts");
  const charts = await api.chartsList(application);
  s.succeed();
  outputs.list(charts, format);
}

export default {
  list,
};
