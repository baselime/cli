import chalk from "chalk";
import { prompt } from "enquirer";

export async function promptFunctionsSelect(fns: string[]): Promise<string[]> {
  const { functions } = await prompt<{ functions: string[] }>({
    type: "multiselect",
    name: "functions",
    message: `${chalk.bold("Select the serverless functions in this application")} (Press [Space] to select multiple functions)`,
    choices: fns.map(fn => { return { name: fn, value: fn } }),
  });

  return functions;
}