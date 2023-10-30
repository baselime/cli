import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Service } from "../../../services/api/paths/services";
import { Query } from "../../../services/api/paths/queries";
import spinner from "../../../services/spinner";
import { KeySet } from "../../../services/api/paths/keys";
import ms from "ms";
import { Dataset } from "../../../services/api/paths/datasets";

export async function promptQuerySelect(): Promise<Query | undefined> {
  const s = spinner.get();
  s.start("Fetching your queries...");
  const queries = await api.queriesList();
  s.succeed();

  const choices = [
    { name: "Create new query", value: "" },
    ...queries.map((query) => {
      return { name: query.id, value: query.id };
    }),
  ];
  const { id } = await prompt<{ id: string }>({
    type: "select",
    name: "id",
    message: `${chalk.bold("Select a query")}`,
    choices,
  });

  return queries.find((q) => q.id === id);
}

export async function promptFrom(): Promise<string> {
  const { from } = await prompt<{ from: string }>({
    type: "input",
    name: "from",
    initial: "1hour",
    message: "Start time: (UTC start time - may also be relative eg: 1h, 20mins)",
  });

  return from;
}

export async function promptTo(): Promise<string> {
  const { to } = await prompt<{ to: string }>({
    type: "input",
    name: "to",
    initial: "now",
    message: "End time: (UTC end time - may also be relative eg: 1h, 20mins, now):",
  });

  return to;
}

export async function promptGranularity(initial: number): Promise<string> {
  const { granularity } = await prompt<{ granularity: string }>({
    type: "input",
    name: "granularity",
    initial: `${ms(initial)}`,
    message: "Granularity: (Size of the query result bins - may also be relative eg: 1h, 20mins):",
  });

  return granularity;
}

export async function promptDatasets(applicableDatasets: Dataset[]): Promise<string[]> {
  const choices: Record<string, string> = {};

  applicableDatasets.forEach((dataset) => {
    choices[dataset.id] = dataset.id;
  });

  let datasets: string[] = [];
  while (!datasets.length) {
    const result = await prompt<{ datasets: string[] }>({
      type: "multiselect",
      name: "datasets",
      min: 1,
      message: `${chalk.bold("Select datasets (using [Space])")}`,
      choices: Object.keys(choices).sort(),
    });
    datasets = result.datasets;
  }
  return datasets.map((name) => choices[name]);
}

export async function promptCalculations(keySets: KeySet[]): Promise<{ operator: string; key: string }[]> {
  const s = spinner.get();

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Add a calculations?",
    choices: [{ name: "Yes" }, { name: "No" }],
  });
  if (name !== "Yes") {
    return [];
  }

  const calculationsDict: Record<string, Record<string, boolean>> = {};
  const terminationSymbol = "← RETURN";

  const choices =
    keySets.length > 0
      ? [
          { name: terminationSymbol },
          { name: "COUNT" },
          { name: "COUNT_DISTINCT" },
          { name: "AVG" },
          { name: "MAX" },
          { name: "MIN" },
          { name: "P001" },
          { name: "P05" },
          { name: "P10" },
          { name: "P25" },
          { name: "P75" },
          { name: "P90" },
          { name: "P95" },
          { name: "P99" },
          { name: "P999" },
          { name: "SUM" },
          { name: "STDDEV" },
          { name: "VARIANCE" },
        ]
      : [{ name: terminationSymbol }, { name: "COUNT" }];
  let operator = "";
  do {
    const calculationResult = await prompt<{ name: string }>({
      type: "select",
      name: "name",
      message: () => {
        let current = getCalculationsAsString(calculationsDict);
        if (current) {
          current = chalk.cyan(`Added calculations: ${current}`);
        } else {
        }
        return `${chalk.bold("Which calculations to add?")}. ${current}`;
      },
      choices,
    });
    operator = calculationResult.name;
    if (operator !== terminationSymbol) {
      await promptCompute(calculationsDict, operator, keySets);
    }
  } while (operator !== terminationSymbol);
  const calculations = convertCalculationTreeToArray(calculationsDict);
  if (calculations.length) {
    s.info(`Selected calculations: ${calculations.map((calc) => `${calc.operator}(${calc.key})`)}`);
  }
  return calculations;
}

export function getCalculationsAsString(calculationsDict: Record<string, Record<string, boolean>>): string {
  return convertCalculationTreeToArray(calculationsDict)
    .map((calc) => `${calc.operator}(${calc.key})`)
    .join(", ");
}

function convertCalculationTreeToArray(calculationsDict: Record<string, Record<string, boolean>>): { operator: string; key: string }[] {
  const calculations: { operator: string; key: string }[] = [];
  for (const [operator, keyObj] of Object.entries(calculationsDict)) {
    if (operator === "COUNT") {
      calculations.push({
        key: "",
        operator,
      });
    } else {
      for (const [key] of Object.entries(keyObj as any)) {
        calculations.push({
          key,
          operator,
        });
      }
    }
  }
  return calculations;
}

export async function promptFilters(keySets: KeySet[]): Promise<{ key: string; operator: string; type: string; value: string }[]> {
  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Add a filter?",
    choices: [{ name: "Yes" }, { name: "No" }],
  });
  if (name === "Yes") {
    const { key } = await prompt<{ key: string }>({
      type: "autocomplete",
      name: "key",
      message: "Please select the key to apply filter on",
      choices: [{ name: "$baselime.namespace", value: "$baselime.namespace" }, ...keySetsToChoices(keySets)],
    });

    const { operator } = await prompt<{ operator: string }>({
      type: "select",
      name: "operator",
      //@ts-ignore
      message: (state: any): string => {
        const selected = state.choices[state.index || 0];
        return `Please select key conditional operator: ${key} ${selected.name}`;
      },
      choices: ["!=", "<", "<=", "=", ">", ">=", "MATCH_REGEX", "DOES_NOT_EXIST", "EXISTS", "IN", "DOES_NOT_INCLUDE", "INCLUDES", "LIKE", "NOT_LIKE", "NOT_IN", "STARTS_WITH"],
    });
    const { value } = await prompt<{ value: string }>({
      type: "input",
      name: "value",
      message: `${key} ${operator} `,
    });
    return [
      {
        key,
        operator,
        value,
        type: "string",
      },
    ];
  }
  return [];
}

async function promptCompute(calculationsDict: Record<string, Record<string, boolean>> = {}, operator: string, keySets: KeySet[]) {
  if (operator === "COUNT") {
    calculationsDict[operator] = {
      [operator]: true,
    };
    return;
  }

  //@ts-ignore
  const keyResult = await prompt<{ value: { type: string; name: string; dataset: string } }>({
    type: "autocomplete",
    name: "value",
    //@ts-ignore
    message: (state: any): string => {
      const current = getCalculationsAsString(calculationsDict);
      const selected = state.choices[state.index];
      let hint;
      if (selected) {
        hint = `${chalk.greenBright(`${operator}(${selected.value.name})`)}`;
      } else {
        hint = `${chalk.greenBright(`${operator}(${state.input})`)}`;
      }
      return `${chalk.bold(`Please select key for calculation: ${hint}`)} \nCurrent: ${current}`;
    },
    choices: keySets.flatMap((keySet) => {
      let shortType: string;
      switch (keySet.type) {
        case "number":
          shortType = "N";
          break;
        case "string":
          shortType = "S";
          break;
        case "boolean":
          shortType = "B";
          break;
      }
      return keySet.keys.map((key) => ({
        name: `(${shortType}) ${key}`,
        value: {
          type: keySet.type,
          name: key,
          dataset: keySet.dataset,
        },
      }));
    }),
    limit: 10,
  });
  if (!calculationsDict[operator]) {
    calculationsDict[operator] = {};
  }
  calculationsDict[operator][keyResult.value.name] = true;
}

export async function promptNeedle() {
  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Searching for particular value?",
    choices: [{ name: "Yes" }, { name: "No" }],
  });
  if (name !== "Yes") {
    return;
  }
  const { value } = await prompt<{ value: string }>({
    type: "input",
    name: "value",
    message: "Insert searched value.",
  });

  const regex = "Regular expression";
  const matchCase = "Match case";

  const { options } = await prompt<{ options: string[] }>({
    type: "multiselect",
    name: "options",
    message: `${chalk.bold("Please select options below")}`,
    choices: [matchCase, regex],
  });
  return {
    value,
    isRegex: options.includes(regex),
    matchCase: options.includes(matchCase),
  };
}

interface GroupByProps {
  limit: number;
  order: string;
  orderBy: string;
  type: string;
  value: string;
}

export async function promptGroupBy(keySets: KeySet[], calculations: { operator: string; key: string }[]): Promise<GroupByProps | undefined> {
  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Group results by a key?",
    choices: [{ name: "Yes" }, { name: "No" }],
  });
  if (name !== "Yes") {
    return;
  }
  const { value: groupByKey } = await prompt<{ value: string }>({
    type: "autocomplete",
    name: "value",
    message: "Which key to group by?",
    choices: keySetsToChoices(keySets),
  });
  const {
    props: { values: { limit, order } },
  } = await prompt<{ props: { values: { limit: string; order: string } } }>({
    type: "snippet",
    name: "props",
    message: "Complete group by parameters",
    //@ts-ignore
    fields: [
      {
        name: "limit",
        readResources(value: any): string | undefined {
          value = Math.floor(value);
          if (!isNaN(value) && value > 0 && value < 10000) {
            return undefined;
          }
          return "Limit must be a natural, positive number below 10000";
        },
      },
      {
        name: "order",
        readResources(value: any): string | undefined {
          if (value === "DESC" || value === "ASC") {
            return undefined;
          }
          return "Invalid order, must be: DESC or ASC";
        },
      },
    ],
    template: `grouped by ${groupByKey} up to \${limit} results ordered by COUNT in \${order} order`,
  });
  const { orderField } = await prompt<{ orderField: string }>({
    type: "select",
    name: "orderField",
    message: "Which field to order by?",
    choices: calculations.map((calculation) => calculation.operator),
  });
  return {
    value: groupByKey,
    limit: Number(limit),
    order: order,
    orderBy: orderField,
    type: "string",
  };
}

interface KeySetOption {
  name: string;
  value: string;
  extra: {
    type: string;
    name: string;
    dataset: string;
  };
}

function keySetsToChoices(keySets: KeySet[]): KeySetOption[] {
  return keySets.flatMap((keySet) => {
    let shortType: string;
    switch (keySet.type) {
      case "number":
        shortType = "N";
        break;
      case "string":
        shortType = "S";
        break;
      case "boolean":
        shortType = "B";
        break;
    }
    return keySet.keys.map((key) => ({
      name: `(${shortType}) ${key}`,
      value: key,
      extra: {
        type: keySet.type,
        name: key,
        dataset: keySet.dataset,
      },
    }));
  });
}
