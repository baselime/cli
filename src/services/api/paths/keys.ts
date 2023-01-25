import {Event} from "./events";
import {client} from "../clients";
import {QueryRun, QueryRunCreateParams, Series} from "./query-runs";
import {Timeframe} from "./alerts";

interface KeysGetParams {
    workspaceId: string,
    environmentId: string,
    params: {
        datasets: string[]
        timeframe: Timeframe,
        service: string
    }
}

export type KeySet = {
    keys: string[];
    dataset: string;
    type: string;
}

async function getKeys(params: KeysGetParams): Promise<KeySet[]> {
    const res = (
        await client.get(`/keys/`, {
            params: {
                from: params.params.timeframe.from,
                to: params.params.timeframe.to,
                datasets: params.params.datasets,
            }
        }
    )).data;
    return res.keys;
}

export default {
    getKeys
}