import { client } from "../clients";
import { Alert, AlertThreshold, Timeframe } from "./alerts";
import { Aggregates } from "./query-runs";

export interface AlertCheck {
  workspaceId: string;
  environmentId: string;
  alertId: string;
  id: number;
  timeframe: Timeframe;
  granularity: number;
  triggered: boolean;
  aggregates: Aggregates;
  calculationKey: string;
  time: string;
  threshold: AlertThreshold;
  created?: string;
  updated?: string;
}

async function alertChecksCreate(id: string, trigger?: boolean, quiet?: boolean): Promise<{ alert: Alert; check: AlertCheck }> {
  const { alert, check } = (await client.post("/alert-checks", { alertId: id, trigger, quiet })).data;
  return { alert, check };
}

export default {
  alertChecksCreate,
};
