import chalk from "chalk";
import { CommandBuilder } from "yargs";
import { enable } from "../../services/telemetry/telemetry";
import { printError } from "../../shared";


export const command = "enable";
export const desc = "Enable Baselime telemetry collection";

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .example([
      [`
      # Enable Baselime telemetry collection:
      $0 telemetry enable
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler() {
  enable();
  console.log("\nStatus:", chalk.bold(chalk.green("Enabled")));
  console.log(
    "Baselime telemetry is completely anonymous. Thank you for participating!\n"
  );
}
