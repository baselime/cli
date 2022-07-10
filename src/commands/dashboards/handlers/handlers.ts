import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat, application?: string) {
  const s = spinner.get();
  s.start("Fetching your dashboards");
  const dashboards = await api.dashboardsList(application);
  s.succeed();
  outputs.list(dashboards, format);
}

export default {
  list,
};
