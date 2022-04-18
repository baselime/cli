import { Arguments, CommandBuilder } from "yargs";

import { baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import { init } from "../services/config";
import { Options } from "./init/types";
import * as prompts from "./init/prompts";
import { existsSync } from "fs";

export const command = "init";
export const desc = "Initialises a .baselime.yml config file";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
    })
    .example([["$0 init"]])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  const filename = ".baselime.yml";

  if (existsSync(`./${filename}`)) {
    const res = await prompts.promptReplaceExistingConfig(filename);
    if (!res) {
      process.exit(0);
    }
  }

  const application = await prompts.application();
  const description = await prompts.description();

  s.start("Generating your config file");
  init(filename, application, description);
  s.succeed(`${filename} Generated`);
}
