import { DeploymentResources } from "../../../commands/apply/handlers/checks";
import { client } from "../clients";


export interface DiffCreateRequest {
  resources: DeploymentResources;
  application: string;
  reverse: boolean;
}

enum ResourceTypes {
  queries = 'queries',
  alerts = 'alerts',
  charts = 'charts',
  channels = 'channels',
  dashboards = 'dashboards',
}

export enum statusType {
  VALUE_CREATED = 'created',
  VALUE_UPDATED = 'updated',
  VALUE_DELETED = 'deleted',
  VALUE_UNCHANGED = 'unchanged',
}

async function diffsCreate(params: DiffCreateRequest): Promise<{ [key in ResourceTypes]: { status: statusType; resource: Record<string, any> }[] }> {
  const res = (await client.post(`/diffs`, params, { timeout: 120000 })).data;
  return res.diff;
}

export default {
  diffsCreate,
};
