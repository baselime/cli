import { Arguments, CommandBuilder } from "yargs";
import spinner from "../services/spinner";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import handlers from "./plan/handlers";
import { UserVariableInputs } from "./push/handlers/validators";

export interface Options extends BaseOptions {
  config?: string;
  variables?: (string | number)[];
}

export const command = "plan";
export const desc = "Show changes required by the current configuration";

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
      variables: {
        type: "array",
        desc: "The variables to replace when doing the plan",
      },
    })
    .example([
      [`
      $0 plan
      $0 plan --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  spinner.init(!!argv.quiet);
  const { config, profile, variables: vars } = argv;
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
  await handlers.plan(config as string, stage, variables);
}

