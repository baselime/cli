import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "../handlers/outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat, application?: string) {
  const s = spinner.get();
  s.start("Fetching your alerts");
  const alerts = await api.alertsList(application);
  s.succeed();
  outputs.list(alerts, format);
}

async function check(format: OutputFormat, data: {application: string; id?: string; trigger?: boolean}) {
  const s = spinner.get();
  s.start("Checking...");
  const ids = data.id ? [data.id] : (await api.alertsList(data.application)).map(alert => alert.id)
  const promises = ids.map(async id => {return await api.alertsRunCheck(data.application, id, data.trigger)});

  const result = await Promise.all(promises);

  const checks = result.map(result => result.check);
  s.succeed();
  outputs.check(checks, format);
}

export default {
  list,
  check,
};
