import spinner from "../../services/spinner/index";
import api from "../../services/api/api";
import { OutputFormat } from "../../shared";
import outputs from "./outputs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

async function mark(data: {
  format: OutputFormat;
  service: string;
  url?: string;
  name?: string;
  description?: string;
  metadata?: string;
  startTime?: number;
  endTime?: number;
  type?: string;
}) {
  const { format, service, url, name, description, metadata, startTime, endTime, type } = data;
  const s = spinner.get();
  s.start("Creating marker");

  let parsed: Record<string, any> | undefined;
  if (metadata) {
    try {
      parsed = JSON.parse(metadata);
    } catch (error) {
      s.fail("Failed to parse the marker metadata");
      console.error(error);
      return;
    }
  }

  const marker = await api.markerCreate({
    service,
    url,
    name,
    description,
    metadata: parsed,
    startTime: startTime || dayjs().valueOf(),
    endTime,
    type,
  });

  s.succeed("Marker created");
  outputs.mark({ marker, format });
}

export default {
  mark,
};
