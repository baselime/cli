import { DeploymentResources } from "../../../commands/push/handlers/checks";
import { client } from "../clients";


export interface DiffCreateRequest {
  resources: DeploymentResources;
  application: string;
  metadata: {
    description?: string;
    provider: string;
    version: string;
    infrastructure?: {
      stacks?: string[];
    }
  };
  reverse: boolean;
}

enum ResourceTypes {
  queries = 'queries',
  alerts = 'alerts',
}

export enum statusType {
  VALUE_CREATED = 'created',
  VALUE_UPDATED = 'updated',
  VALUE_DELETED = 'deleted',
  VALUE_UNCHANGED = 'unchanged',
}

export type DiffResponse = {
  application: { status: statusType; application: Record<string, any>, deepDiff?: object };
  resources: { [key in ResourceTypes]: { status: statusType; resource: Record<string, any>, deepDiff?: any }[] };
}



async function diffsCreate(params: DiffCreateRequest): Promise<DiffResponse> {
  const res = (await client.post(`/diffs`, params, { timeout: 120000 })).data;
  return res.diff;
}

export default {
  diffsCreate,
};
