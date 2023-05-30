import { UserConfig } from "../../auth";
import { client, getDataUrl } from "../clients";
import { Event } from "./events";

export interface QueryRun {
  id: number;
  query: {
    id: string;
  };
  workspaceId: string;
  environmentId: string;
  service: string;
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

export type Aggregates = Array<{
  groups?: Record<string, any>;
  values: Record<string, number>;
}>;

export interface Series {
  time: string;
  data: SeriesData;
}

export interface SeriesData {
  _count: number | Record<string, number>;
  [key: string]: number | undefined | Record<string, number>;
}

export interface QueryRunGetParams {
  service: string;
  queryId: string;
  id: string;
  events?: boolean;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}

export interface QueryRunCreateParams {
  service: string;
  queryId: string;
  timeframe: {
    from: number;
    to: number;
  };
  parameters?: {
    datasets?: string[];
    calculations?: {
      key: string;
      operator: string;
    }[];
    filters?: {
      key: string;
      operation: string;
      type: string;
      value: string;
    }[];
    needle?: {
      value: string;
      isRegex: boolean;
      matchCase: boolean;
    };
    groupBy?: {
      limit: number;
      order: string;
      orderBy: string;
      type: string;
      value: string;
    };
  };
  config: UserConfig;
}

async function queryRunsList(service: string, queryId: string): Promise<QueryRun[]> {
  const res = (await client.get(`/query-runs/${service}/${queryId}`)).data;
  return res.queryRuns;
}

async function queryRunGet(params: QueryRunGetParams): Promise<{ queryRun: QueryRun[]; events: Event[]; calculations: Record<string, any>; count: number }> {
  const res = (
    await client.get(`/query-runs/${params.service}/${params.queryId}/${params.id}`, {
      params: {
        events: params.events,
        from: params.from,
        to: params.to,
        limit: params.limit,
        offset: params.offset,
      },
    })
  ).data;
  return res;
}

async function queryRunCreate(params: QueryRunCreateParams): Promise<{
  queryRun: QueryRun;
  calculations: { series: Series[]; aggregates?: Aggregates };
  events: { events?: Event[]; count?: number; series?: Series[]; fields?: { name: string; type: string }[] };
}> {
  const { workspace, environment } = params.config;
  const req = { ...params, workspaceId: params.config.workspace, environmentId: params.config.environment };
  const res = (await client.post(`${getDataUrl()}/query_runs`, req, { timeout: 30000 })).data.data;
  return res;
}

export default {
  queryRunsList,
  queryRunGet,
  queryRunCreate,
};
