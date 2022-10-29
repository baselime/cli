import chalk from "chalk";
import { prompt } from "enquirer";
import { basename, resolve } from "path";
import api from "../../services/api/api";
import spinner from "../../services/spinner";

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

  if (allStacks.length === 0) {
    throw new Error("No stacks found. Please make sure you have at least one CloudFormation Stack in this environment.");
  }

  let stacks: string[] = [];
  while(stacks.length === 0) {
    const res = await prompt<{ stacks: string[] }>({
      type: "multiselect",
      name: "stacks",
      message: `${chalk.bold("Please select CloudFormation stacks for this application (Select multiple with [Space] and confirm with [Enter])")}`,
      choices: allStacks.map(stack => { return { name: stack, value: stack } }),
    });
    stacks = res.stacks;
  
    if (stacks.length === 0) {
      await prompt<{ confirm: boolean }>({
        type: "confirm",
        name: "confirm",
        initial: true,
        message: `Please make sure to select with [Space] before confirm with [Enter])`,
      });
    }
  }
 

  return stacks;
}

export async function promptForApplication(): Promise<string> {

  const { application } = await prompt<{ application: string }>({
    type: "input",
    name: "application",
    message: "What's the name of this application?",
    required: true,
    initial: basename(resolve()),
  });

  return application.replace(/[^\w\s]/gi, '-');
}
