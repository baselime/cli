import { client } from "../clients";

export interface QueryParameters {
  groupBys?: string[];
  namespaces?: Array<{
    type: string;
    value: string;
  }>;
  filters?: Array<QueryFilter>;
  filterCombination: "AND" | "OR";
  calculations: Array<{
    key: string;
    operator: string;
  }>;
}

export interface QueryFilter {
  key: string;
  operation: string;
  value: string | number | boolean | { key: string };
  type: string;
}

export interface Query {
  parameters: QueryParameters;
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  environmentId: string;
  ref: string;
  application: string;
  userId: string;
  created?: string;
  updated?: string;
}

async function queriesList(application?: string): Promise<Query[]> {
  const res = (await client.get("/queries", { params: { application } })).data;
  return res.queries;
}

export default {
  queriesList,
};
