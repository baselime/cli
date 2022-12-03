import { writeFileSync } from "fs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { getVersion, OutputFormat } from "../../shared";
import outputs from "../alerts/handlers/outputs";

async function status(format: OutputFormat, data: { service: string, outFile: string }) {
  const s = spinner.get();
  s.start("Checking...");
  const ids = (await api.alertsList(data.service)).map(alert => alert.id)
  const promises = ids.map(async id => { return await api.alertChecksCreate(data.service, id, false) });

  const result = await Promise.all(promises);

  const checks = result.map(result => result.check);
  s.succeed();
  outputs.check(checks, format);
  writeFileSync(data.outFile, JSON.stringify({ 
    version: getVersion(),
    service: data.service,
    alertChecks: checks
  }));
}

export default {
  status,
};
