import chalk from "chalk";
import { CommandBuilder } from "yargs";
import { disable } from "../../services/telemetry/telemetry";
import { printError } from "../../shared";


export const command = "disable";
export const desc = "Disable Baselime's telemetry collection";

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .example([
      [`
      # Disable Baselime's telemetry collection:
      $0 telemetry disable
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler() {
  disable();
  console.log("\nStatus:", chalk.bold(chalk.red("Disabled")), "\n");
  console.log("You have opted out of Baselime's anonymous telemetry program.");
  console.log("No data will be collected from your machine.\n");
}
