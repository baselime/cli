import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../../services/api/api";
import { Alert } from "../../../services/api/paths/alerts";
import { Service } from "../../../services/api/paths/services";
import spinner from "../../../services/spinner";

export async function promptServiceSelect(): Promise<Service | undefined> {
  const s = spinner.get();
  s.start("Fetching your service");
  const services = await api.servicesList();
  s.succeed();

  if (services.length === 0) {
    throw new Error("No service found. Please create at least one Baselime service.");
  }

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Please select a service")}`,
    choices: services.map((service) => {
      return { name: service.name, value: service.name };
    }),
  });

  return services.find((service) => service.name === name);
}

export async function promptAlertSelect(service?: string): Promise<Alert | undefined> {
  const s = spinner.get();
  s.start("Fetching your alert");
  const alerts = await api.alertsList(service);
  s.succeed();

  if (alerts.length === 0) {
    throw new Error("No alert found. Please create at least one Baselime alert.");
  }

  const { id } = await prompt<{ id: string }>({
    type: "select",
    name: "id",
    message: `${chalk.bold("Please select an alert")}`,
    choices: alerts.map((query) => {
      return { name: query.id, value: query.id };
    }),
  });

  return alerts.find((q) => q.id === id);
}
