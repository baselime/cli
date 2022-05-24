import { client } from "../clients";

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


export async function getEvents(dataset: string, from: number, to: number, namespaces: string[], offset: number, limit: number): Promise<Event[]> {
  const res = (await client.get(`/events`, { params: { dataset, from, to, namespaces, offset, limit } })).data;
  return res.events;
}

export default {
  getEvents,
}