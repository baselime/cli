import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import { OutputFormat } from "../../../shared";
import { getTimeframe } from "../../../services/timeframes/timeframes";
import outputs from "./outputs";
import { promisify } from "util";
import dayjs from "dayjs";
const wait = promisify(setTimeout);

async function stream(format: OutputFormat, dataset: string, from: string, to: string, follow: boolean) {
  const s = spinner.get();
  if (!follow) {
    s.start("Streaming your events");
    const { from: f, to: t } = getTimeframe(from, to);
    const events = await api.getEvents(dataset, f, t, [], 0, 1000);
    s.succeed();
    outputs.stream(events, format);
    return;
  }

  let { from: f, to: t } = getTimeframe("1minute", "now");
  while (true) {
    const events = await api.getEvents(dataset, f, t, [], 0, 1000);
    const now = dayjs();
    f = t - 1;
    // go back 5 seconds in order to account for events delivery time
    t = now.valueOf() - 5000;
    outputs.stream(events, format);
    await wait(5000);
  }
}

export default {
  stream,
};