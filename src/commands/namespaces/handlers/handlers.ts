import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";

async function list(format: OutputFormat, datasets: string[], from: string, to: string) {
  const s = spinner.get();
  s.start("Fetching your namespaces");
  const { from: f, to: t } = getTimeframe(from, to);
  const namspaces = await api.namespacesList(datasets, f, t);
  s.succeed();
  outputs.list(namspaces, format);
}

export default {
  list,
};
