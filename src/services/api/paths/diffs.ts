import { DeploymentResources, DeploymentVariable } from "../../../commands/push/handlers/validators";
import { client } from "../clients";
import { TemplateVariable } from "./templates";

export interface DiffCreateRequest {
  resources: DeploymentResources;
  service: string;
  metadata: {
    description?: string;
    provider: string;
    version: string;
    infrastructure?: {
      stacks?: string[];
    };
    templates?: TemplateMetadata[];
    variables: Record<string, DeploymentVariable>;
  };
  reverse: boolean;
}

export interface TemplateMetadata {
  name: string;
  variables?: Record<string, TemplateVariable>;
  applyOnSave?: boolean;
}

enum ResourceTypes {
  queries = "queries",
  alerts = "alerts",
}

export enum statusType {
  VALUE_CREATED = "created",
  VALUE_UPDATED = "updated",
  VALUE_DELETED = "deleted",
  VALUE_UNCHANGED = "unchanged",
}

export type DiffResponse = {
  service: { status: statusType; service: Record<string, any> };
  resources: { [key in ResourceTypes]: { status: statusType; resource: Record<string, any> }[] };
};

async function diffsCreate(params: DiffCreateRequest): Promise<DiffResponse> {
  const res = (await client.post("/diffs", params, { timeout: 120000 })).data;
  return res.diff;
}

export default {
  diffsCreate,
};
