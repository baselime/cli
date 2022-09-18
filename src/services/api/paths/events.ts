import { stringify } from "qs";
import { client } from "../clients";
import { NamespaceCombination, QueryFilter } from "./queries";

export interface Event {
  _namespace: string;
  _timestamp: string;
  _source: string;
  _logId: string;
  _baselimeId: string;
  _now?: number;
  _stream: string;
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


export async function listEvents(datasets: string[], filters: QueryFilter[], from: number, to: number, namespaces: string[], namespaceCombination: NamespaceCombination, offset: number, limit: number): Promise<{ events: Event[]; fields: { name: string, type: string, }[]; series: Series[]; count: number; timeframe: { from: number; to: number; } }> {
  const params = { datasets, from, to, namespaces, offset, limit, filters, namespaceCombination };
  const res = (await client.get(`/events/?${stringify(params)}`)).data;
  return res.events;
}

export default {
  listEvents,
}