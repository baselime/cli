import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Service } from "../../../services/api/paths/services";
import { Query } from "../../../services/api/paths/queries";
import spinner from "../../../services/spinner";
import {Workspace} from "../../../services/api/paths/auth";

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
  const s = spinner.get();
  const choices = [
    {name: "API Gateway logs", value: "apigateway-logs"},
    {name: "CloudTrail", value: "cloudtrail"},
    {name: "CloudWatch Metrics", value: "cloudwatch-metrics"},
    {name: "Open Telemetry", value: "otel"},
    {name: "X-Ray", value: "x-ray"},
  ];

  let results: { name: string[] } = {name: []};
  while (results.name.length < 1) {
    results = await prompt<{ name: string[] }>({
      type: "multiselect",
      name: "name",
      min: 1,
      message: `${chalk.bold("Please select datasets")}`,
      choices,
    });
    if (results.name.length == 0) {
      s.info("Please select at least one dataset");
    }
  }
  return choices.filter(choice => results.name.includes(choice.name)).map(choice => choice.value);
}

export async function promptCalculations(keys: string[]): Promise<{operator: string, key: string}[]> {
  const terminationSymbol = "←";
  const calculationsDict: any = {};
  const choices = [
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
  ];
  let operator = "";
  do {
    const calculationResult = await prompt<{ name: string }>({
      type: "select",
      name: "name",
      message: `${chalk.bold("Please select calculations")}`,
      choices,
    });
    operator = calculationResult.name;
    if (operator == "COUNT") {
      calculationsDict[operator] = true;
    } else if (operator != terminationSymbol) {
      //@ts-ignore
      const keyResult = await prompt<{ name: string }>({
        type: "autocomplete",
        name: "name",
        //@ts-ignore
        message: async (state: any): string  => {
          const selected = state.choices[state.index];
          let hint;
          if (selected) {
            hint = `${chalk.greenBright(`${operator}(${selected.name})`)}`;
          } else {
            hint = `${chalk.greenBright(`${operator}(${state.input})`)}`;
          }
          return `${chalk.bold(`Please select key for calculation: ${hint}`)}`;
        },
        choices: keys,
        limit: 10,
      });
      if(calculationsDict[operator]) {
        calculationsDict[operator][keyResult.name] = true;
      } else {
        calculationsDict[operator] = {
          [keyResult.name]: true,
        }
      }
    }
  } while (operator != terminationSymbol);
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