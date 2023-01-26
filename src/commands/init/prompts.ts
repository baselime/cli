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
    message: "Do you want to bootstrap with a template? Templates provide baseline observability for your service",
  });

  if (!confirm) return;

  const s = spinner.get();
  s.start("Fetching your templates");
  const templates = (await api.templatesList()).map((t) => `${t.workspaceId}/${t.name}`);
  s.succeed();

  const { template } = await prompt<{ template: string }>({
    type: "select",
    name: "template",
    message: `${chalk.bold("Please select a template")}`,
    choices: templates.map((template) => {
      return { name: template, value: template };
    }),
  });

  return template;
}

export async function promptForService(): Promise<string> {
  const { service } = await prompt<{ service: string }>({
    type: "input",
    name: "service",
    message: "What's the name of this service?",
    required: true,
    initial: basename(resolve()),
  });

  return service.replace(/[^\w\s]/gi, "-");
}
