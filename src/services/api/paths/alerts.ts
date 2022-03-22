import { client } from "../clients";

export interface AlertParameters {
  queryId: string;
  threshold: AlertThreshold;
  frequency: number;
  duration: number;
}

export interface AlertChannels {
  type: string;
  target: string;
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
  channels: AlertChannels[];
  created?: string;
  updated?: string;
}

async function alertsList(): Promise<Alert[]> {
  const res = (await client.get("/alerts")).data;
  return res.alerts;
}

export default {
  alertsList,
};
