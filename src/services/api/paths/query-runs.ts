import { client } from "../clients";

export interface QueryRun {
  id: number;
  queryId: string,
  workspaceId: string;
  environmentId: string;
  timeframe: {
    from: number;
    to: number;
  };
  userId: string;
  status: "STARTED" | "COMPLETED";
  granularity: number;
  created?: string;
  updated?: string;
}

export interface Event {
  _namespace: string;
  _timestamp: number;
  _source: string;
  _logId: string;
  _baselimeId: string;
  _now?: number;
  _stream: string;
  [key: string]: any;
}

export interface Bin {
  bin: string;
  [key: string]: number | string;
}

export interface queryRunGetParams {
  queryId: string;
  id: string;
  events?: boolean;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}

export interface queryRunCreateParams {
  queryId: string;
  timeframe: {
    from: number;
    to: number;
  }
}

async function queryRunsList(queryId: string): Promise<QueryRun[]> {
  const res = (await client.get(`/query-runs/${queryId}`)).data;
  return res.queryRuns;
}

async function queryRunGet(params: queryRunGetParams): Promise<{ queryRun: QueryRun[]; events: Event[]; calculations: Record<string, any>; count: number }> {
  const res = (await client.get(`/query-runs/${params.queryId}/${params.id}`, {
    params: {
      events: params.events,
      from: params.from,
      to: params.to,
      limit: params.limit,
      offset: params.offset,
    }
  })).data;
  return res;
}

async function queryRunCreate(params: queryRunCreateParams): Promise<{ queryRun: QueryRun; calculations: { aggregates: Record<string, any>; bins: Bin[] }; }> {
  const res = (await client.post(`/query-runs/`, params)).data;
  return res;
}

export default {
  queryRunsList,
  queryRunGet,
  queryRunCreate,
};
