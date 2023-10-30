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
  EMAIL = "email",
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
  channels: { type: ChannelTypes; targets: string[] }[];
  created?: string;
  updated?: string;
}

export interface Timeframe {
  from: number;
  to: number;
}

async function alertsList(): Promise<Alert[]> {
  const res = (await client.get("/alerts")).data;
  return res.alerts;
}

export default {
  alertsList,
};
