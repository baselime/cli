import { client } from "../clients";

export interface AlertParameters {
  queryId: string;
  threshold: AlertThreshold;
  frequency: string;
  window: string;
}

export interface AlertThreshold {
  operation: string;
  value: number;
}

export enum ChannelTypes {
  SLACK = "slack",
  WEBHOOK = "webhook",
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
  service: string;
  channels: { type: ChannelTypes; targets: string[] }[];
  created?: string;
  updated?: string;
}

export interface Timeframe {
  from: number;
  to: number;
}

async function alertsList(service?: string): Promise<Alert[]> {
  const res = (await client.get("/alerts", { params: { service } })).data;
  return res.alerts;
}


export default {
  alertsList,
};
