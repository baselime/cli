import chalk from "chalk";
import { prompt } from "enquirer";
const { StringPrompt, AutoComplete, BooleanPrompt } = require("enquirer");
import { basename, resolve } from "path";
import api from "../../services/api/api";
import { Service } from "../../services/api/paths/services";
import spinner from "../../services/spinner";

export async function promptReplaceExistingConfig(filename: string): Promise<boolean> {
  const prompt = new BooleanPrompt({
    message: `Replace existing config folder ${filename}?`,
    footer: `\n${chalk.grey("We want to make sure you don't delete anything by mistake.")}`,
  });

  const confirm = await prompt.run();
  return confirm;
}

export async function promptTemplateSelect(): Promise<string | undefined> {
  const s = spinner.get();
  s.start("Fetching your templates");
  const templates = (await api.templatesList()).map((t) => `${t.workspaceId}/${t.name}`);
  s.succeed();

  const choices = [
    { name: "blank-template", value: "blank-template" },
    ...templates.map((template) => {
      return { name: template, value: template };
    }),
  ];

  const prompt = new AutoComplete({
    name: "template",
    message: "Select a template",
    choices,
    footer: `\n${chalk.grey(
      "The Baselime community created a few cool observability templates to help you getting started and get insights on your service.\nView the full list of templates here:",
    )} https://baselime.io/templates`,
  });

  const template = await prompt.run();
  if (template === "blank-template") return;

  return template;
}

export async function promptForNewService(): Promise<string> {
  const prompt = new StringPrompt({
    message: "Name the new service",
    required: true,
    initial: basename(resolve()),
    footer: `\n${chalk.gray(
      "A service is a single component of a software application that provides a specific functionality (typically a microservice). A service typically maps to a set of CloudFormation templates or a code repository.",
    )}`,
  });

  const service = await prompt.run();

  return service.replace(/[^\w\s]/gi, "-");
}

export async function promptForService(): Promise<{ isCreate: boolean; name: string }> {
  const s = spinner.get();
  s.start("Fetching your services");
  const services = await api.servicesList();
  s.succeed();

  const choices = services.map((service) => {
    return {
      name: service.name,
      message: service.name,
      value: service.name,
    };
  });
  const create = { name: "baselime-create-a-service", message: "Create a service", value: "baselime-create-an-environment" };

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Select a service")}`,
    choices: [create, ...choices],
    result(value) {
      return value;
    },
  });

  if (name === create.value) {
    return { isCreate: true, name };
  }

  return { isCreate: false, name };
}
