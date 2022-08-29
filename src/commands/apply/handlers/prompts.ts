import chalk from "chalk";
import { prompt } from "enquirer";

export async function promptApply(): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `${chalk.bold("Do you want to perform these actions?")}`,
  });

  return confirm;
}
