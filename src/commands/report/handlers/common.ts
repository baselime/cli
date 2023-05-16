import spinner from "../../../services/spinner";
import { authenticate, getVersion, OutputFormat } from "../../../shared";
import { readFile } from "fs-extra";
import { AlertCheck } from "../../../services/api/paths/alert-checks";
import { validateMetadata } from "../../deploy/handlers/validators";
import api from "../../../services/api/api";
import outputs from "./outputs";

export async function commonHandler(profile: string, quiet: boolean, path?: string, config?: string, service?: string, format?: OutputFormat) {
  spinner.init(quiet);
  await authenticate(profile);

  const s = spinner.get();

  let status;
  if (path) {
    status = JSON.parse((await readFile(path)).toString()) as { version: string; service: string; alertChecks: AlertCheck[] };
  } else {
    service = service || (await validateMetadata(config!)).service;
    s.start("Creating snapshots...");
    const ids = (await api.alertsList(service)).map((alert) => alert.id);
    const promises = ids.map(async (id) => {
      return await api.alertChecksCreate(service!, id, false, false);
    });

    const result = await Promise.all(promises);
    s.succeed("All alert snapshots created");
    console.log();
    const checks = result.map((result) => result.check);
    outputs.snapshot(checks, format || "table");
    status = {
      version: getVersion(),
      alertChecks: checks,
      service,
    };
  }
  return status;
}
