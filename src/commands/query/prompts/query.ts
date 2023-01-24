import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Service } from "../../../services/api/paths/services";
import { Query } from "../../../services/api/paths/queries";
import spinner from "../../../services/spinner";
import {Workspace} from "../../../services/api/paths/auth";
import {getTimeframe} from "../../../services/timeframes/timeframes";
import dayjs from "dayjs";
import {KeySet} from "../../../services/api/paths/keys";

export async function promptServiceSelect(): Promise<Service | undefined> {
  const s = spinner.get();
  s.start("Fetching your services");
  const services = await api.servicesList();
  s.succeed();

  if (services.length === 0) {
    throw new Error("No service found. Please create at least one Baselime service.");
  }

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Please select an service")}`,
    choices: services.map((service) => {
      return { name: service.name, value: service.name };
    }),
  });

  return services.find((service) => service.name === name);
}

export async function promptRunSavedQuery(): Promise<boolean> {
  const { message } = await prompt<{ message: string }>({
    type: "select",
    name: "message",
    message: "Run a saved query?",
    choices: ["Saved query", "Interactive query builder"],
  });
  return message === "Saved query";
}

export async function promptQuerySelect(service?: string): Promise<Query | undefined> {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = await api.queriesList(service);
  s.succeed();

  if (queries.length === 0) {
    throw new Error("No query found. Please create at least one Baselime query.");
  }

  const { id } = await prompt<{ id: string }>({
    type: "select",
    name: "id",
    message: `${chalk.bold("Please select a query")}`,
    choices: queries.map((query) => {
      return { name: query.id, value: query.id };
    }),
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

export async function promptDatasets(): Promise<string[]> {
  const choices: Record<string, string> = {
  "API Gateway logs": "apigateway-logs",
  "CloudTrail": "cloudtrail",
  "CloudWatch Metrics": "cloudwatch-metrics",
  "Open Telemetry": "otel",
  "X-Ray": "x-ray",
  }
  // const choices = [
  //   {name: "API Gateway logs", value: "apigateway-logs"},
  //   {name: "CloudTrail", value: "cloudtrail"},
  //   {name: "CloudWatch Metrics", value: "cloudwatch-metrics"},
  //   {name: "Open Telemetry", value: "otel"},
  //   {name: "X-Ray", value: "x-ray"},
  // ];

  let datasets: string[] = [];
  while (!datasets.length) {
    const result = await prompt<{datasets: string[]}>({
      type: "multiselect",
      name: "datasets",
      min: 1,
      message: `${chalk.bold("Please select datasets")}`,
      choices: Object.keys(choices),
    });
    datasets = result.datasets;
  }
  return datasets.map(name => choices[name]);
}

export async function promptCalculations(keySets: KeySet[]): Promise<{ operator: string; key: string }[]> {
  const s = spinner.get();

  const {name} = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Would you like to add any calculations?",
    choices: [
      {name: "Yes"},
      {name: "No"},
    ],
  });
  if(name != "Yes") {
    return [];
  }


  const calculationsDict: Record<string, Record<string, boolean>> = {};
  const terminationSymbol = "← RETURN";

  const choices = keySets.length > 0
      ? [
          {name: terminationSymbol},
          {name: "COUNT"},
          {name: "AVG"},
          {name: "MAX"},
          {name: "MIN"},
          {name: "P001"},
          {name: "P05"},
          {name: "P10"},
          {name: "P25"},
          {name: "P75"},
          {name: "P90"},
          {name: "P95"},
          {name: "P99"},
          {name: "P999"},
          {name: "SUM"},
      ] : [
        {name: terminationSymbol},
        {name: "COUNT"},
      ];
  let operator = "";
  do {
    const calculationResult = await prompt<{ name: string }>({
      type: "select",
      name: "name",
      message: () => {
        let current = getCalculationsAsString(calculationsDict);
        if (current) {
          current = chalk.cyan(`Added calculations: ${current}`)
        } else {

        }
        return `${chalk.bold("Which calculations to add?")}. ${current}`
      },
      choices,
    });
    operator = calculationResult.name;
    if (operator != terminationSymbol) {
      await promptCompute(calculationsDict, operator, keySets)
    }
  } while (operator != terminationSymbol);
  const calculations = convertCalculationTreeToArray(calculationsDict);
  if (calculations.length) {
    s.info(`Selected calculations: ${calculations.map(calc => (`${calc.operator}(${calc.key})`))}`);
  }
  return calculations;
}

export function getCalculationsAsString(calculationsDict: Record<string, Record<string, boolean>>): string {
  return convertCalculationTreeToArray(calculationsDict)
      .map(calc => `${calc.operator}(${calc.key})`)
      .join(", ");
}

function convertCalculationTreeToArray(calculationsDict: Record<string, Record<string, boolean>>): {operator: string, key: string}[] {
  const calculations: {operator: string, key: string}[] = [];
  for (const [operator, keyObj] of Object.entries(calculationsDict)) {
    if (operator == "COUNT") {
      calculations.push({
        key: "",
        operator,
      })
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
  const {name} = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Would you like to add a filter?",
    choices: [
      {name: "Yes"},
      {name: "No"},
    ],
  });
  if(name == "Yes") {
    const {key} = await prompt<{ key: string }>({
      type: "select",
      name: "key",
      message: "Please select the key to apply filter on",
      choices: [
        {name: "$baselime.namespace"},
        ...keySets.map(keySet => keySet.keys.map(key =>({name: "", key}))).flat(),
      ],
    });
    const {operator} = await prompt<{ operator: string }>({
      type: "select",
      name: "operator",
      message: "Please select key conditional operator",
      choices: [
        "!=",
        "<",
        "<=",
        "=",
        ">",
        ">=",
        "DOES_NOT_EXIST",
        "EXISTS",
        "IN",
        "INCLUDES",
        "NOT_IN",
        "STARTS_WITH",
      ],
    });
    const {value} = await prompt<{value: string}>({
      type: 'input',
      name: `value`,
      message: 'Insert value to check against'
    });
    return [
      {
        key,
        operator,
        value,
        type: "string"
      }
    ];
  }
  return [];
}

async function promptCompute(calculationsDict: Record<string, Record<string, boolean>> = {}, operator: string, keySets: KeySet[]) {
  if(operator == "COUNT") {
    calculationsDict[operator] = {
      [operator]: true
    };
    return
  }

  //@ts-ignore
  const keyResult = await prompt<{ value: {type: string, name: string, dataset: string} }>({
    type: "autocomplete",
    name: "value",
    //@ts-ignore
    message: async (state: any): string  => {
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
    choices: keySets.map(keySet => {
      let shortType: string;
      switch (keySet.type) {
        case "number":
          shortType = "N"
          break;
        case "string":
          shortType = "S"
          break;
        case "boolean":
          shortType = "B"
          break;
      }
      return keySet.keys.map(key => ({
        name: `(${shortType}) ${key}`,
        value: {
          type: keySet.type,
          name: key,
          dataset: keySet.dataset
        }
      }))
    }).flat(),
    limit: 10,
  });
  if(!calculationsDict[operator]) {
    calculationsDict[operator] = {};
  }
  calculationsDict[operator][keyResult.value.name] = true;
}


export async function promptNeedle() {
  const {name} = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Searching for particular value?",
    choices: [
      {name: "Yes"},
      {name: "No"},
    ],
  });
  if(name != "Yes") {
    return;
  }
  const {value} = await prompt<{value: string}>({
    type: 'input',
    name: `value`,
    message: 'Insert searched value.'
  });

  const regex = "Regular expression"
  const matchCase = "Match case"

  const {options} = await prompt<{options: string[]}>({
    type: "multiselect",
    name: "options",
    message: `${chalk.bold("Please select options below")}`,
    choices: [
      matchCase,
      regex
    ]
  });
  return {
    value,
    isRegex: options.includes(regex),
    matchCase: options.includes(matchCase),
  }
}