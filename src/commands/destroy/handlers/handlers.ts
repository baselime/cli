import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import * as prompts from "./prompts";
import { validateMetadata } from "../../push/handlers/validators";
import { verifyPlan } from "../../push/handlers/handlers";

async function destroy(config: string, stage?: string) {
  const s = spinner.get();
  const metadata = await validateMetadata(config, stage);
  const resources = { queries: [], alerts: [], dashboards: [] };
  s.start("Checking resources to destroy...");
  // Remove the provider to signal to the API that we're deleting the service
  metadata.provider = "";
  await verifyPlan(metadata, resources, false);
  const res = await prompts.promptPush();

  if (!res) {
    process.exit(0);
  }

  s.start("Destroying your service...");
  await api.serviceDelete(metadata.service);
  s.succeed("Service deleted");
}

export default {
  destroy,
};
