import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Alert } from "../../../services/api/paths/alerts";
import { Application } from "../../../services/api/paths/applications";
import spinner from "../../../services/spinner";

export async function promptApplicationSelect(): Promise<Application | undefined> {
  const s = spinner.get();
  s.start("Fetching your applications");
  const applications = (await api.applicationsList());
  s.succeed();

  if (applications.length === 0) {
    throw new Error("No application found. Please create at least one Baselime application.");
  }

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Please select an application")}`,
    choices: applications.map(application => { return { name: application.name, value: application.name } }),
  });

  return applications.find(app => app.name === name);
}

export async function promptAlertSelect(application?: string): Promise<Alert | undefined> {
  const s = spinner.get();
  s.start("Fetching your alert");
  const alerts = (await api.alertsList(application));
  s.succeed();

  if (alerts.length === 0) {
    throw new Error("No alert found. Please create at least one Baselime alert.");
  }

  const { id } = await prompt<{ id: string }>({
    type: "select",
    name: "id",
    message: `${chalk.bold("Please select an alert")}`,
    choices: alerts.map(query => { return { name: query.id, value: query.id } }),
  });

  return alerts.find(q => q.id === id);
}
