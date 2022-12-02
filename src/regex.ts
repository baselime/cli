import { AlertThreshold } from "./services/api/paths/alerts";
import { QueryCalculation, QueryFilter, QueryOperation, QueryOperator } from "./services/api/paths/queries";

const operations = Object.values(QueryOperation) as QueryOperation[];
const operatiors = Object.values(QueryOperator) as QueryOperator[];
export const queryFilterRegex = new RegExp("^([\\w.@-]+)\\s(" + operations.join("|") + ")\\s?'?(.*?)?'?$");
export const alertThresholdRegex = new RegExp(
  "^(" + operations.filter((o) => !["INCLUDES", "IN", "NOT_IN", "EXISTS", "DOES_NOT_EXIST"].some((f) => o === f)).join("|") + ")\\s([0-9]*)$"
);
export const calculationsRegex = new RegExp(`(${operatiors.join("|")})\\(([^)]*)\\)|(COUNT)$`);
   

export function extractCalculation(input: string): QueryCalculation {
  if (input === "COUNT") {
    return {
      operator: QueryOperator.COUNT,
    };
  }
  const res = input.match(calculationsRegex);
  if (!res) {
    throw new Error(`Calculation '${input}' must match ${calculationsRegex}`);
  }
  return {
    operator: res[1] as QueryOperator,
    key: res[2],
  };
}

export function parseFilter(input: string): QueryFilter {
  const parts = input.match(queryFilterRegex);

  if (!parts || !parts[1] || !parts[2]) {
    throw new Error(`Filter '${input}' must match ${queryFilterRegex}`);
  }

  const key = parts[1];
  const operation = Object.values(QueryOperation).find((i) => i === parts[2])!;
  const value = parts[3];

  if(value === undefined && operation !== QueryOperation.EXISTS && operation !==  QueryOperation.DOES_NOT_EXIST) {
    throw new Error(`Filter '${input}' must have right hand side operand`);
  }

  if (String(Number(value)) === value) {
    return { key, operation, value: Number(value), type: "number" };
  }

  if (value === "true" || value === "false") {
    return { key, operation, value: value === "true" ? true : false, type: "boolean" };
  }

  return { key, operation, value, type: "string" };
}

export function parseThreshold(input: string): AlertThreshold {
  const parts = input.match(alertThresholdRegex);

  if (!parts || !parts[1] || !parts[2]) {
    throw new Error(`Threshold '${input}' must match ${alertThresholdRegex}`);
  }

  const operation = Object.values(QueryOperation).find((i) => i === parts[1])!;
  const value = Number(parts[2]);
  if (Number.isNaN(value)) {
    throw new Error(`The right hand side of threshold '${input}' must be a number`);
  }

  return { operation, value };
}

export function parseTemplateName(s: string): { workspaceId: string; template: string } {
  const workspaceRegex = /[@\/]+/i;

  return {
    workspaceId: s.split(workspaceRegex)[1],
    template: s.split(workspaceRegex)[2]
  }
}
