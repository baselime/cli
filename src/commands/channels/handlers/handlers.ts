import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "../handlers/outputs";
import { OutputFormat } from "../../../shared";

async function list(format: OutputFormat, application?: string) {
  const s = spinner.get();
  s.start("Fetching your channels");
  const channels = await api.channelsList(application);
  s.succeed();
  outputs.list(channels, format);
}

export default {
  list,
};
