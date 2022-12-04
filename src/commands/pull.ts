import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./pull/handlers";
import { UserVariableInputs } from "./push/handlers/checks";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
  variables?: (string | number)[];
}

export const command = "pull";
export const desc = "Pull the state from the remote systems to update the local state";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration folder to execute",
        alias: "c",
        default: ".baselime",
      },
      yes: {
        type: "boolean",
        desc: "Skip the manual validation of changes",
        alias: "y",
        default: false,
      },
      variables: {
        type: "array",
        desc: "The variables to replace when doing the plan",
      },
    })
    .example([
      [`
      $0 pull
      $0 pull --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, yes, variables: vars } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);
  const variables: UserVariableInputs = {};
  vars?.map(variable => {
    const [key, val] = variable.toString().split("=");
    variables[key.trim()] = val.trim();
  });
  await handlers.pull(config!, variables, yes!);
}

