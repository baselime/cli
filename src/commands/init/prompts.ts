import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../services/api/api";
import spinner from "../../services/spinner";

export async function promptFunctionsSelect(provider: string): Promise<string[] | undefined> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: `Manually select cloud functions for this application? (Select multiple with [Space] and confirm with [Enter])`,
  });

  if (!confirm) {
    console.log("This application will encompass all resources in your cloud environment");
    return;
  }

  const s = spinner.get();
  s.start(`Fetching your ${provider} cloud functions`);
  const fns = (await api.functionsList(provider)).map(f => f.name).sort();
  s.succeed();

  const { functions } = await prompt<{ functions: string[] }>({
    type: "multiselect",
    name: "functions",
    message: `${chalk.bold("Select the serverless functions in this application")} (Select multiple with [Space] and confirm with [Enter])`,
    choices: fns.map(fn => { return { name: fn, value: fn } }),
  });

  return functions;
}

export async function promptTemplateSelect(): Promise<string | undefined> {

  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: `Do you want to bootstrap with a template?`,
  });

  if (!confirm) return;

  const s = spinner.get();
  s.start("Fetching your templates");
  const templates = (await api.templatesList()).map(t => `@${t.workspaceId}/${t.name}`);
  s.succeed();

  const { template } = await prompt<{ template: string }>({
    type: "select",
    name: "template",
    message: `${chalk.bold("Please select a template")}`,
    choices: templates.map(template => { return { name: template, value: template } }),
  });

  return template;
}

export async function promptStacksSelect(provider: string): Promise<string[] | undefined> {

  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: `Automatically discover cloud resources for this application? (Select multiple with [Space] and confirm with [Enter])`,
  });

  if (!confirm) return;

  const s = spinner.get();
  s.start(`Fetching your ${provider} stacks`);
  const allStacks = (await api.stacksList(provider)).map(s => s.name).sort();
  s.succeed();

  const { stacks } = await prompt<{ stacks: string[] }>({
    type: "multiselect",
    name: "stacks",
    message: `${chalk.bold("Please select CloudFormation stacks for this application")}`,
    choices: allStacks.map(stack => { return { name: stack, value: stack } }),
  });

  return stacks;
}
