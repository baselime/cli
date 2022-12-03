import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat) {
  const s = spinner.get();
  s.start("Fetching your services");
  const services = await api.servicesList();
  s.succeed();
  outputs.list(services, format);
}

async function describe(name: string, format: OutputFormat) {
  const s = spinner.get();
  s.start(`Fethcing service ${name}`);
  const service = await api.serviceGet(name);
  const deployments = await api.deploymentsList(name, 1);
  s.succeed();
  outputs.describe(service, deployments, format);
}

export default {
  list,
  describe,
};
