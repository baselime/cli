import { Arguments, CommandBuilder } from "yargs";
import chalk from "chalk";
import { EOL } from "os";

interface Options {
  name: string;
  upper?: boolean;
}

export const command = "greet <name>";
export const desc = "Greet <name> with Hello";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      upper: { type: "boolean" },
    })
    .positional("name", { type: "string", demandOption: true });
};

export function handler(argv: Arguments<Options>) {
  const { name, upper } = argv;
  const greeting = `Hello ${name}`;
  const s = upper ? greeting.toUpperCase() : greeting;
  process.stdout.write(chalk.green(chalk.bold(s)) + EOL);
  process.exit(0);
}
