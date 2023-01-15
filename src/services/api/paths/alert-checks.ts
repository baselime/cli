import { client } from "../clients";
import { Alert, AlertThreshold, Timeframe } from "./alerts";

export interface AlertCheck {
  workspaceId: string;
  environmentId: string;
  service: string;
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

async function alertChecksCreate(service: string, id: string, trigger?: boolean, quiet?: boolean): Promise<{ alert: Alert; check: AlertCheck }> {
  const { alert, check } = (await client.post("/alert-checks", { service, alertId: id, trigger, quiet })).data;
  return { alert, check };
}

export default {
  alertChecksCreate,
};
