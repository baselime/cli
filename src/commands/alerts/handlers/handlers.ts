import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "../handlers/outputs";

async function list(json: boolean, application?: string) {
  const s = spinner.get();
  s.start("Fetching your alerts");
  const alerts = await api.alertsList(application);
  s.succeed();
  outputs.list(alerts, json);
}

export default {
  list,
};
