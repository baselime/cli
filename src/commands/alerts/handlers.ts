import spinner from "../../services/spinner/index";
import api from "../../services/api/api";
import outputs from "./outputs";

async function list(json: boolean) {
  const s = spinner.get();
  s.start("Fetching your alerts");
  const alerts = await api.alertsList();
  s.succeed();
  outputs.list(alerts, json);
}

export default {
  list,
}
