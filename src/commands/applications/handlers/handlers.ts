import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "../handlers/outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat) {
  const s = spinner.get();
  s.start("Fetching your applications");
  const applications = await api.applicationsList();
  s.succeed();
  outputs.list(applications, format);
}

async function describe(name: string, format: OutputFormat) {
  const s = spinner.get();
  s.start(`Fethcing application ${name}`);
  const application = await api.applicationGet(name);
  const deployments = await api.deploymentsList(name, 1);
  s.succeed();
  outputs.describe(application, deployments, format);
}

export default {
  list,
  describe,
};
