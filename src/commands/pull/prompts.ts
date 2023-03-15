import chalk from "chalk";
import { prompt } from "enquirer";
import spinner from "../../services/spinner";
import api from "../../services/api/api";

export async function promptRefresh(): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `${chalk.bold("Do you want to perform these actions?")}`,
  });

  return confirm;
}

export async function promptService(): Promise<string> {
  const s = spinner.get();
  s.start("Fetching services");
  const services = await api.servicesList();
  s.succeed();
  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `Which service would you like to pull configuration for?`,
    choices: services.map(service => ({name: service.name})),
  });
  return name;
}