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

export interface Timeframe {
  from: number;
  to: number;
}
export interface AlertCheck {
  workspaceId: string;
  environmentId: string;
  application: string;
  alertId: string;
  id: number;
  timeframe: Timeframe;
  granularity: number;
  triggered: boolean;
  aggregates: Record<string, number | Record<string, number>>;
  calculationKey: string;
  time: string;
  threshold: AlertThreshold;
  created?: string;
  updated?: string;
}

async function alertsList(application?: string): Promise<Alert[]> {
  const res = (await client.get("/alerts", { params: { application } })).data;
  return res.alerts;
}

async function alertsRunCheck(application: string, id: string, trigger?: boolean): Promise<{ alert: Alert, check: AlertCheck }> {
  const { alert, check } = (await client.post(`/alerts/${application}/${id}`, { params: { trigger } })).data;
  return { alert, check };
}

export default {
  alertsList,
  alertsRunCheck,
};
