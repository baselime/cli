import { QueryCalculation, QueryOperator } from "./services/api/paths/queries";

export function buildCalculation(cal: QueryCalculation) {
  const short = buildShortCalculation(cal);
  return `${short}${cal.alias ? ` as ${cal.alias}` : ''}`
}

export function getCalculationAlias(cal: QueryCalculation) {
  return cal.alias ? cal.alias : buildShortCalculation(cal);
}

export function buildShortCalculation(cal: QueryCalculation) {
  if (cal.operator === QueryOperator.COUNT) {
    return cal.operator;
  }
  return `${cal.operator}(${cal.key})`;
}
