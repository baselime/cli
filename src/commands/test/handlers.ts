import { writeFileSync } from "fs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { getVersion, OutputFormat } from "../../shared";
import outputs from "../report/handlers/outputs";

async function test(format: OutputFormat, data: { outFile: string }) {
  const s = spinner.get();
  s.start("Checking alerts...");
  const ids = (await api.alertsList()).map((alert) => alert.id);
  const promises = ids.map(async (id) => {
    return await api.alertChecksCreate(id, false, true);
  });

  const result = await Promise.all(promises);

  const checks = result.map((result) => result.check);
  s.succeed();
  outputs.test(checks, format);
  writeFileSync(
    data.outFile,
    JSON.stringify({
      version: getVersion(),
      alertChecks: checks,
    }),
  );
}

export default {
  test,
};
