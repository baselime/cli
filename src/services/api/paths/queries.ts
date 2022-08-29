import { client } from "../clients";

export interface QueryParameters {
  dataset: string;
  groupBys?: string[];
  namespaces?: string[];
  namespaceCombination?: NamespaceCombination;
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
  value: string | number | boolean;
  type: string;
}

export interface Query {
  parameters: QueryParameters;
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  environmentId: string;
  application: string;
  userId: string;
  created?: string;
  updated?: string;
}

export enum NamespaceCombination {
  INCLUDE = "INCLUDE",
  EXCLUDE = "EXCLUDE",
  STARTS_WITH = "STARTS_WITH",
}

async function queriesList(application?: string): Promise<Query[]> {
  const res = (await client.get("/queries", { params: { application } })).data;
  return res.queries;
}

export default {
  queriesList,
};
