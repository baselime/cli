import { Arguments, CommandBuilder } from "yargs";

import { existsSync } from "fs";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import spinner from "../services/spinner";
import * as prompts from "./applications/handlers/prompts";
import { basename, resolve } from "path";
import api from "../services/api/api";
import { mkdirSync } from "fs";
import { isUrl } from "../utils";
import { init } from "./init/handlers";
import chalk from "chalk";

export interface Options extends BaseOptions {
  application?: string;
  description?: string;
  template?: string;
}

export const command = "init";
export const desc = "Prepare your working directory for other commands";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      application: { type: "string", desc: "Name of the application", alias: "app" },
      description: { type: "string", desc: "Description of the application" },
      template: { type: "string", desc: "Template to intitialise the application with" },
    })
    .example([
      [`
      # Initialise an application:
      $0 init

      # Provide parameters on the command-line:
      $0 init --application <application_name> --description <description>

      # Provide a template on the command-line:
      # The template can be either a local template within Baselime or a public URL to a template

      $0 init --application <application_name> --template @<workspace>/<template>
      $0 init --application <application_name> --template <template-url>
      `]
    ])
    .fail((_, err, yargs) => {
      printError(err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);
  let { application, description, profile, template } = argv;

  const folder = ".baselime";

  if (existsSync(folder)) {
    const res = await prompts.promptReplaceExistingConfig(folder);
    if (!res) {
      process.exit(0);
    }
  } else {
    mkdirSync(folder);
  }

  await authenticate(profile);

  application ??= basename(resolve());
  description ??= "";
  template ??= "";

  if (isUrl(template)) {
    s.fail("Support for public URL as templates is coming soon.");
    return;
  }

  s.start("Generating your config folder");
  console.log(chalk.whiteBright(chalk.bold("\nPrepare to select the serverless functions in this application.")))
  const user = await api.iamGet();
  await init(folder, application, description, template, user.email,);
  s.succeed(`${folder} Generated`);
}
