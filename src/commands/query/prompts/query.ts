import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Service } from "../../../services/api/paths/services";
import { Query } from "../../../services/api/paths/queries";
import spinner from "../../../services/spinner";

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
