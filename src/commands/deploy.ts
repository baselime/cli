import { Arguments, CommandBuilder } from "yargs";

import { authenticate, BaseOptions, baseOptions, printError } from "../shared";
import spinner from "../services/spinner/index";
import handlers from "./deploy/handlers/handlers";
import { UserVariableInputs } from "./deploy/handlers/validators";

export interface Options extends BaseOptions {
  config?: string;
  yes?: boolean;
  "dry-run"?: boolean;
  variables?: (string | number)[];
}

export const command = "deploy";
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
      "dry-run": {
        type: "boolean",
        desc: "Checks the changes that will be made to the remote when applying, without actually making the request",
        default: false,
      },
      variables: {
        type: "array",
        desc: "The variables to replace when doing the plan",
      },
    })
    .example([
      [
        `
      $0 deploy
      $0 deploy --config .baselime --profile prod`,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { config, profile, yes, variables: vars, "dry-run": dryRun } = argv;
  spinner.init(!!argv.quiet);

  await authenticate(profile);
  let stage = "";
  const variables: UserVariableInputs = {};
  if (vars?.length === 1 && !vars[0].toString().includes("=")) {
    stage = vars[0].toString();
  } else {
    vars?.map((variable) => {
      const [key, val] = variable.toString().split("=");
      variables[key.trim()] = val.trim();
    });
  }
  await handlers.deploy(config!, stage, variables, yes!, dryRun!);
}
