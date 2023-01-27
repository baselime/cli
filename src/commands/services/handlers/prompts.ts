import chalk from "chalk";
const { BooleanPrompt } = require("enquirer");

export async function promptReplaceExistingConfig(filename: string): Promise<boolean> {
  const prompt = new BooleanPrompt({
    message: `Replace existing config folder ${filename}?`,
    footer: `\n${chalk.grey("We want to make sure you don't delete anything by mistake.")}`,
  });

  const confirm = await prompt.run();
  return confirm;
}
