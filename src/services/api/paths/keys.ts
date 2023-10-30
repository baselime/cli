import { Event } from "./events";
import { client, getDataUrl } from "../clients";
import { QueryRun, QueryRunCreateParams, Series } from "./query-runs";
import { Timeframe } from "./alerts";
import { UserConfig } from "../../auth";

interface KeysGetParams {
  datasets: string[];
  timeframe: Timeframe;
  config: UserConfig;
}

export type KeySet = {
  keys: string[];
  dataset: string;
  type: string;
};

async function getKeys(params: KeysGetParams): Promise<KeySet[]> {
  const { workspace, environment } = params.config;
  const res = (
    await client.get(`${getDataUrl()}/keys/${workspace}/${environment}`, {
      params: {
        from: params.timeframe.from,
        to: params.timeframe.to,
        datasets: params.datasets,
      },
    })
  ).data;
  return res.keys;
}

export default {
  getKeys,
};
