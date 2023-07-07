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
  startTime?: number;
  endTime?: number;
  type?: string;
}) {
  const { format, service, url, name, description, startTime, endTime, type, } = data;
  const s = spinner.get();
  s.start("Creating marker");

  const marker = await api.markerCreate({
    service,
    url,
    name,
    description,
    startTime: startTime || dayjs().valueOf(),
    endTime,
    type,
  });

  s.succeed("Marker created");
  outputs.mark({marker, format});
}

export default {
  mark,
};
