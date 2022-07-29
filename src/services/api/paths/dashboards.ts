import { client } from "../clients";

export interface Dashboard {
  workspaceId: string;
  environmentId: string;
  id: string;
  application: string;
  ref: string;
  name: string;
  description: string;
  charts: string[];
  userId: string;
  created?: string;
  updated?: string;
}

async function dashboardsList(application?: string, ref?: string): Promise<Dashboard[]> {
  const res = (await client.get("/dashboards", { params: { application, ref } })).data;
  return res.dashboards;
}

export default {
  dashboardsList,
};
