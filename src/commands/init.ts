import { Arguments, CommandBuilder } from "yargs";

import { existsSync } from "fs";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import spinner from "../services/spinner";
import * as prompts from "./applications/handlers/prompts";
import { init } from "../services/config";
import { basename, resolve } from "path";
import api from "../services/api/api";

export interface Options extends BaseOptions {
  application?: string;
  description?: string;
}

export const command = "init";
export const desc = "Prepare your working directory for other commands";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "Name of the application", alias: "app" },
      description: { type: "string", desc: "Description of the application" },
    })
    .example([
      [`
      # Initialise an application:
      $0 init

      # Provide parameters on the command-line:
      $0 init --application <application_name> --description <description>
      `]
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);
  let { application, description, profile } = argv;

  const filename = ".baselime.yml";

  if (existsSync(`./${filename}`)) {
    const res = await prompts.promptReplaceExistingConfig(filename);
    if (!res) {
      process.exit(0);
    }
  }

  await authenticate(profile);

  application ??= basename(resolve());
  description ??= "";

  s.start("Generating your config file");
  const user = await api.iamGet();
  init(filename, application, description, user.email);
  s.succeed(`${filename} Generated`);
}
