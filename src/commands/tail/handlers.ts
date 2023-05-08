import spinner from "../../services/spinner/index";
import api from "../../services/api/api";
import { OutputFormat } from "../../shared";
import { getTimeframe } from "../../services/timeframes/timeframes";
import outputs from "./outputs";
import { promisify } from "util";
import dayjs from "dayjs";
const wait = promisify(setTimeout);
import utc from "dayjs/plugin/utc";
import { QueryFilter, SearchNeedle } from "../../services/api/paths/queries";
import { UserConfig } from "../../services/auth";
dayjs.extend(utc);

async function tail(data: {
  format: OutputFormat;
  datasets: string[];
  filters: QueryFilter[];
  needle?: string;
  from: string;
  to: string;
  follow: boolean;
  service?: string;
  field?: string;
  matchCase: boolean;
  config: UserConfig;
  regex?: string;
}) {
  const { format, datasets, filters, needle, from, to, follow, matchCase, regex, service, field, config } = data;
  const s = spinner.get();

  const n: SearchNeedle = {
    item: needle || regex || "",
    isRegex: !!regex,
    matchCase,
  };

  if (!follow) {
    s.start("Tailing your events");
    const { from: f, to: t } = getTimeframe(from, to);
    const events = await api.listEvents({ config, datasets, filters, needle: n, from: f, to: t, service: service, offset: 0, limit: 100 });
    s.succeed();
    outputs.tail(events.events, format);
    return;
  }

  let { from: f, to: t } = getTimeframe("1minute", "now");
  while (true) {
    const events = await api.listEvents({ config, datasets, filters, needle: n, from: f, to: t, service: service, offset: 0, limit: 100 });
    const now = dayjs();

    f = events.events[0] ? dayjs.utc(events.events[0]._timestamp).valueOf() : f;
    t = now.valueOf();
    outputs.tail(events.events, format, field);
    await wait(200);
  }
}

export default {
  tail,
};
