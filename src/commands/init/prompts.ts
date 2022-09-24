import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../services/api/api";
import spinner from "../../services/spinner";

export async function promptFunctionsSelect(fns: string[]): Promise<string[]> {
  const { functions } = await prompt<{ functions: string[] }>({
    type: "multiselect",
    name: "functions",
    message: `${chalk.bold("Select the serverless functions in this application")} (Press [Space] to select multiple functions)`,
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

  if(!confirm) return;

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

export async function promptStackSelect(provider: string): Promise<string | undefined> {

  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: `Automatically discover cloud resources for this application?`,
  });

  if(!confirm) {
    console.log("This application will encompass all resources in your cloud environment");
    return;
  }

  const s = spinner.get();
  s.start(`Fetching your ${provider} stacks`);
  const stacks = (await api.stacksList(provider)).map(s => s.name).sort();
  s.succeed();

  const { stack } = await prompt<{ stack: string }>({
    type: "select",
    name: "stack",
    message: `${chalk.bold("Please select a CloudFormation stack")}`,
    choices: stacks.map(stack => { return { name: stack, value: stack } }),
  });

  return stack;
}
