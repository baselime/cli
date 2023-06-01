import { stringify } from "qs";
import { client, getDataUrl } from "../clients";
import { QueryFilter, SearchNeedle } from "./queries";
import { UserConfig } from "../../auth";

export interface EventsListRequest {
  datasets: string[];
  filters: QueryFilter[];
  needle?: SearchNeedle;
  service?: string;
  from: number;
  to: number;
  offset: number;
  limit: number;
  config: UserConfig;
}

export interface Event {
  _namespace: string;
  _timestamp: string;
  _source: string;
  _dataset: string;
  _logId: string;
  _baselimeId: string;
  _now?: number;
  [key: string]: any;
}

export interface Series {
  time: string;
  data: SeriesData[];
}

export interface SeriesData {
  aggregates: {
    _count: number;
    [key: string]: number | undefined;
  }
  groups?: Record<string, any>
}

export async function listEvents(
  data: EventsListRequest,
): Promise<{ events: Event[]; fields: { name: string; type: string }[]; series: Series[]; count: number; timeframe: { from: number; to: number } }> {
  const res = (await client.get(`${getDataUrl()}/events/${data.config.workspace}/${data.config.environment}/?${stringify(data)}`)).data;
  return res;
}

export default {
  listEvents,
};
