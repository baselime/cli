import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./push/handlers/handlers";
import { UserVariableInputs } from "./push/handlers/checks";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
  variables?: (string | number)[];
}

export const command = "push";
export const desc = "Create or update observability configurations";

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
      $0 push
      $0 push --config .baselime --profile prod`,
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
  let stage = "";
  const variables: UserVariableInputs = {};
  if (vars?.length === 1 && !vars[0].toString().includes("=")) {
    stage = vars[0].toString();
  } else {
    vars?.map(variable => {
      const [key, val] = variable.toString().split("=");
      variables[key.trim()] = val.trim();
    });
  }
  await handlers.push(config!, stage, variables, yes!);
}

