import { client } from "../clients";
import { NamespaceCombination } from "./queries";

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


export async function getEvents(dataset: string, from: number, to: number, namespaces: string[], namespaceCombination: NamespaceCombination, offset: number, limit: number): Promise<Event[]> {
  const params = { dataset, from, to, namespaces, offset, limit, namespaceCombination };
  const res = (await client.get(`/events`, { params })).data;
  return res.events;
}

export default {
  getEvents,
}