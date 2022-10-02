import { client } from "../clients";

export interface AlertParameters {
  queryId: string;
  threshold: AlertThreshold;
  frequency: number | string;
  duration: number;
}

export interface AlertThreshold {
  operation: string;
  value: number;
}

export interface Alert {
  parameters: AlertParameters;
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  environmentId: string;
  userId: string;
  enabled: boolean;
  application: string;
  channels: string[];
  created?: string;
  updated?: string;
}

async function alertsList(application?: string): Promise<Alert[]> {
  const res = (await client.get("/alerts", { params: { application } })).data;
  return res.alerts;
}

export default {
  alertsList,
};
