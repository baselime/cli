import { client } from "../clients";

export interface Widget {
  queryId: string;
  type: WidgetType;
  name?: string;
  description?: string;
}

export enum WidgetType {
  TIMESERIES = "timeseries",
  STATISTIC = "statistic",
  TABLE = "table",
  TIMESERIES_BAR = "timeseries_bar",
}

export interface Dashboard {
  id: string;
  name?: string;
  description?: string;
  workspaceId: string;
  environmentId: string;
  service: string;
  userId: string;
  parameters: DashboardParameters;
  created?: string;
  updated?: string;
}

export interface DashboardParameters {
  widgets: Widget[];
}

async function dashboardsList(service?: string): Promise<Dashboard[]> {
  const res = (await client.get("/dashboards", { params: { service } })).data;
  return res.alerts;
}

export default {
  dashboardsList,
};
