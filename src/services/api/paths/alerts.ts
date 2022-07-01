import { client } from "../clients";

export interface AlertParameters {
  queryId: string;
  threshold: AlertThreshold;
  frequency: number;
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
  ref: string;
  application: string;
  channels: string[];
  created?: string;
  updated?: string;
}

async function alertsList(application?: string, ref?: string): Promise<Alert[]> {
  const res = (await client.get("/alerts", { params: { application, ref } })).data;
  return res.alerts;
}

export default {
  alertsList,
};
