import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import outputs from "./outputs";
import { promisify } from "util";
import dayjs from "dayjs";
const wait = promisify(setTimeout);
import utc from "dayjs/plugin/utc"
import { NamespaceCombination } from "../../../services/api/paths/queries";
dayjs.extend(utc);

async function stream(format: OutputFormat, datasets: string[], from: string, to: string, namespaces: string[], combination: NamespaceCombination, follow: boolean) {
  const s = spinner.get();
  if (!follow) {
    s.start("Streaming your events");
    const { from: f, to: t } = getTimeframe(from, to);
    const events = await api.getEvents(datasets, f, t, namespaces, combination, 0, 100);
    s.succeed();
    outputs.stream(events.events, format);
    return;
  }

  let { from: f, to: t } = getTimeframe("1minute", "now");
  while (true) {
    const events = await api.getEvents(datasets, f, t, namespaces, combination, 0, 100);
    const now = dayjs();
    
    f = events.events[0] ? dayjs.utc(events.events[0]._timestamp).valueOf() : f;
    t = now.valueOf();
    outputs.stream(events.events, format);
    await wait(2000);
  }
}

export default {
  stream,
};