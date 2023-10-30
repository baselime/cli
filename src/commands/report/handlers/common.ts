import spinner from "../../../services/spinner";
import { authenticate, getVersion, OutputFormat } from "../../../shared";
import { readFile } from "fs-extra";
import { AlertCheck } from "../../../services/api/paths/alert-checks";
import api from "../../../services/api/api";
import outputs from "./outputs";

export async function commonHandler(quiet: boolean, path?: string, format?: OutputFormat) {
  spinner.init(quiet);

  const s = spinner.get();

  let status;
  if (path) {
    status = JSON.parse((await readFile(path)).toString()) as { version: string; alertChecks: AlertCheck[] };
  } else {
    s.start("Creating snapshots...");
    const ids = (await api.alertsList()).map((alert) => alert.id);
    const promises = ids.map(async (id) => {
      return await api.alertChecksCreate(id, false, true);
    });

    const result = await Promise.all(promises);
    s.succeed("All alert snapshots created");
    console.log();
    const checks = result.map((result) => result.check);
    outputs.test(checks, format || "table");
    status = {
      version: getVersion(),
      alertChecks: checks,
    };
  }
  return status;
}
