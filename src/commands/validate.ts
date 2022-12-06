import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./push/handlers/handlers";
import { UserVariableInputs } from "./push/handlers/checks";

export interface Options extends BaseOptions {
  config?: string;
  variables?: (string | number)[];
}

export const command = "validate";
export const desc = "Check whether the configuration is valid";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      config: {
        type: "string",
        desc: "The configuration file to execute",
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
      $0 validate
      $0 validate --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, variables: vars } = argv;
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
  await handlers.validate(config!, stage, variables);
}

