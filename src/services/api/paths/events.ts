import { stringify } from "qs";
import { client } from "../clients";
import { QueryFilter, SearchNeedle } from "./queries";

export interface EventsListRequest {
  datasets: string[];
  filters: QueryFilter[];
  needle?: SearchNeedle;
  service?: string;
  from: number;
  to: number;
  offset: number;
  limit: number;
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
  data: SeriesData;
}

export interface SeriesData {
  _count: number | Record<string, number>;
  [key: string]: number | undefined | Record<string, number>;
}


export async function listEvents(data: EventsListRequest): Promise<{ events: Event[]; fields: { name: string, type: string, }[]; series: Series[]; count: number; timeframe: { from: number; to: number; } }> {
  const res = (await client.get(`/events/?${stringify(data)}`)).data;
  return res.events;
}

export default {
  listEvents,
}