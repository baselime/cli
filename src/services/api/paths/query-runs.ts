import { client } from "../clients";

export interface QueryRun {
  id: number;
  query: {
    id: string;
  };
  workspaceId: string;
  environmentId: string;
  application: string;
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
  data: SeriesData
}

export interface SeriesData {
  _count: number | Record<string, number>;
  [key: string]: number | undefined | Record<string, number>;
}

export interface QueryRunGetParams {
  application: string;
  queryId: string;
  id: string;
  events?: boolean;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}

export interface QueryRunCreateParams {
  application: string;
  queryId: string;
  timeframe: {
    from: number;
    to: number;
  }
}

async function queryRunsList(application: string, queryId: string): Promise<QueryRun[]> {
  const res = (await client.get(`/query-runs/${application}/${queryId}`)).data;
  return res.queryRuns;
}

async function queryRunGet(params: QueryRunGetParams): Promise<{ queryRun: QueryRun[]; events: Event[]; calculations: Record<string, any>; count: number }> {
  const res = (await client.get(`/query-runs/${params.application}/${params.queryId}/${params.id}`, {
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

async function queryRunCreate(params: QueryRunCreateParams): Promise<{ queryRun: QueryRun; calculations: { series: Series[]; aggregates: Record<string, number | Record<string, number>> }; }> {
  const res = (await client.post(`/query-runs/`, params, { timeout: 30000 })).data;
  return res;
}

export default {
  queryRunsList,
  queryRunGet,
  queryRunCreate,
};
