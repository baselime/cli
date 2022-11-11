import { client } from "../clients";

export interface QueryParameters {
  datasets: string[];
  namespaces?: string[];
  namespaceCombination?: NamespaceCombination;
  filters?: Array<QueryFilter>;
  filterCombination: "AND" | "OR";
  calculations: QueryCalculation[];
  groupBy?: QueryGroupBy;
  needle?: SearchNeedle;
}

export interface QueryFilter {
  key: string;
  operation: QueryOperation;
  value: string | number | boolean;
  type: string;
}

export interface QueryGroupBy { 
  type: "string" | "number" | "boolean";
  value: string;
  orderBy?: string;
  limit?: number; 
  order?: "ASC" | "DESC";
}

export interface QueryCalculation {
  key: string;
  operator: QueryOperator;
}

export enum QueryOperator {
  COUNT = "COUNT",
  MAX = "MAX",
  MIN = "MIN",
  SUM = "SUM",
  AVG = "AVG",
  MEDIAN = "MEDIAN",
  P001 = "P001",
  P01 = "P01",
  P05 = "P05",
  P10 = "P10",
  P25 = "P25",
  P75 = "P75",
  P90 = "P90",
  P95 = "P95",
  P99 = "P99",
  P999 = "P999",
}

export enum QueryOperation {
  EQUAL = "=",
  DIFFERENT = "!=",
  GREATER_THAN = ">",
  GREATER_THAN_EQUAL = ">=",
  LOWER_THAN = "<",
  LOWER_THAN_EQUAL = "<=",
  INCLUDES = "INCLUDES",
  IN = "IN",
  NOT_IN = "NOT_IN",
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

export interface SearchNeedle {
  item: string;
  isRegex?: boolean;
  matchCase?: boolean;
}


async function queriesList(application?: string): Promise<Query[]> {
  const res = (await client.get("/queries", { params: { application } })).data;
  return res.queries;
}

export default {
  queriesList,
};
