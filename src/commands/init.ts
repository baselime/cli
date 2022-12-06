import { Arguments, CommandBuilder } from "yargs";

import { existsSync, rmSync } from "fs";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import spinner from "../services/spinner";
import * as prompts from "./services/handlers/prompts";
import { mkdirSync } from "fs";
import { isUrl } from "../utils";
import { init } from "./init/handlers";
import { promptForService, promptTemplateSelect } from "./init/prompts";

export interface Options extends BaseOptions {
  service?: string;
  description?: string;
  template?: string;
  provider: string;
}

export const command = "init";
export const desc = "Prepare your working directory for other commands";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      service: { type: "string", desc: "Name of the service" },
      description: { type: "string", desc: "Description of the service" },
      template: { type: "string", desc: "Template to intitialise the service with" },
      provider: { type: "string", desc: "Cloud provider", default: "aws", choices: ["aws"] },
    })
    .example([
      [`
      # Initialise a service:
      $0 init

      # Provide parameters on the command-line:
      $0 init --service <service_name> --description <description>

      # Provide a template on the command-line:
      # The template can be either a local template within Baselime or a public URL to a template

      $0 init --service <service_name> --template <workspace>/<template>
      $0 init --service <service_name> --template <template-url>
      `]
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);
  let { service, description, profile, template, provider } = argv;

  const folder = ".baselime";

  if (existsSync(folder)) {
    const res = await prompts.promptReplaceExistingConfig(folder);
    if (!res) {
      process.exit(0);
    }
    rmSync(folder, { recursive: true, force: true });
  }

  mkdirSync(folder);
  await authenticate(profile);

  service ??= await promptForService();
  description ??= "";
  template ??= await promptTemplateSelect();

  if (template && isUrl(template)) {
    s.fail("Support for public URL as templates is coming soon.");
    return;
  }

  await init(folder, service, description, provider, template);
  s.succeed(`${folder} Generated`);
}
