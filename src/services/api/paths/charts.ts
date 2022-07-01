import { client } from "../clients";

export interface Chart {
  workspaceId: string;
  environmentId: string;
  id: string;
  application: string;
  ref: string;
  name: string;
  type: ChartType;
  parameters?: ChartParameters;
  userId: string;
  created?: string;
  updated?: string;
}

interface ChartParameters {
  query: string;
  duration: number;
  xaxis?: string;
  yaxis?: string;
}

enum ChartType {
  STATS = "stats",
  TIMESERIES = "timeseries",
  BAR = "bar",
}

async function chartsList(application?: string, ref?: string): Promise<Chart[]> {
  const res = (await client.get("/charts", { params: { application, ref } })).data;
  return res.charts;
}

export default {
  chartsList,
};
