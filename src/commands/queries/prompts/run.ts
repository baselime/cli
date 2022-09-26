import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Application } from "../../../services/api/paths/applications";
import { Query } from "../../../services/api/paths/queries";
import spinner from "../../../services/spinner";

export async function promptApplicationSelect(): Promise<Application | undefined> {
  const s = spinner.get();
  s.start("Fetching your applications");
  const applications = (await api.applicationsList());
  s.succeed();

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Please select an application")}`,
    choices: applications.map(application => { return { name: application.name, value: application.name } }),
  });

  return applications.find(app => app.name === name);
}

export async function promptQuerySelect(application?: string): Promise<Query | undefined> {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = (await api.queriesList(application));
  s.succeed();

  const { id } = await prompt<{ id: string }>({
    type: "select",
    name: "id",
    message: `${chalk.bold("Please select a query")}`,
    choices: queries.map(query => { return { name: query.id, value: query.id } }),
  });

  return queries.find(q => q.id === id);
}

export async function promptFrom(): Promise<string> {
  const { from } = await prompt<{ from: string }>({
    type: "input",
    name: "from",
    initial: "1hour",
    message: `${chalk.bold("Start time: (UTC start time - may also be relative eg: 1h, 20mins):")}`,
  });

  return from;
}

export async function promptTo(): Promise<string> {
  const { to } = await prompt<{ to: string }>({
    type: "input",
    name: "to",
    initial: "now",
    message: `${chalk.bold("End time: (UTC end time - may also be relative eg: 1h, 20mins, now):")}`,
  });

  return to;
}
