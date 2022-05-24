import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import outputs from "./outputs";
import { promisify } from "util";
import dayjs from "dayjs";
const wait = promisify(setTimeout);
import utc from "dayjs/plugin/utc"
dayjs.extend(utc);

async function stream(format: OutputFormat, dataset: string, from: string, to: string, namespaces: string[], follow: boolean) {
  const s = spinner.get();
  if (!follow) {
    s.start("Streaming your events");
    const { from: f, to: t } = getTimeframe(from, to);
    const events = await api.getEvents(dataset, f, t, namespaces, 0, 100);
    console.log(events)
    s.succeed();
    outputs.stream(events, format);
    return;
  }

  let { from: f, to: t } = getTimeframe("1minute", "now");
  while (true) {
    const events = await api.getEvents(dataset, f, t, namespaces, 0, 100);
    const now = dayjs();
    
    f = events[0] ? dayjs.utc(events[0]._timestamp).valueOf() : f;
    t = now.valueOf();
    outputs.stream(events, format);
    await wait(2000);
  }
}

export default {
  stream,
};