import chalk from "chalk";
import { prompt } from "enquirer";
const { StringPrompt, AutoComplete } = require("enquirer");
import { basename, resolve } from "path";
import api from "../../services/api/api";
import spinner from "../../services/spinner";

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

export async function promptForService(): Promise<string> {
  const prompt = new StringPrompt({
    message: "Name the new service",
    required: true,
    initial: basename(resolve()),
    footer: `\n${chalk.gray(
      "A service is a group of observability resources (queries, alerts, etc.) that belong to the same domain. A service typically maps to a code repo or a folder in mono-repos.",
    )}`,
  });

  const service = await prompt.run();

  return service.replace(/[^\w\s]/gi, "-");
}
