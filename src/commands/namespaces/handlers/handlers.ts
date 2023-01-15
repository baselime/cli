import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";

async function list(format: OutputFormat, from: string, to: string, service?: string) {
  const s = spinner.get();
  s.start("Fetching your namespaces");
  const { from: f, to: t } = getTimeframe(from, to);
  const namspaces = await api.namespacesList(f, t, service);
  s.succeed();
  outputs.list(namspaces, format);
}

export default {
  list,
};
