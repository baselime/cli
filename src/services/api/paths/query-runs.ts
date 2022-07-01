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

export interface Series {
  time: string;
  data: {
    _count: number;
    [key: string]: number | string | undefined;
  }
}

export interface QueryRunGetParams {
  queryId: string;
  id: string;
  events?: boolean;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}

export interface QueryRunCreateParams {
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

async function queryRunGet(params: QueryRunGetParams): Promise<{ queryRun: QueryRun[]; events: Event[]; calculations: Record<string, any>; count: number }> {
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

async function queryRunCreate(params: QueryRunCreateParams): Promise<{ queryRun: QueryRun; calculations: { aggregates: Record<string, any>; series: Series[] }; }> {
  const res = (await client.post(`/query-runs/`, params)).data;
  return res;
}

export default {
  queryRunsList,
  queryRunGet,
  queryRunCreate,
};
