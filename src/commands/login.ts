import { Arguments, CommandBuilder } from "yargs";
import api from "../services/api/api";
import { readUserAuth, writeUserAuth } from "../services/auth";
import spinner from "../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../shared";
import { credentialsConfigured, userConfigFound, welcome } from "./auth/handlers/outputs";
import {
  promptAWSAccountId,
  promptAWSRegion,
  promptEnvironmentAlias,
  promptForEnvironment,
  promptForOneTimePassword,
  promptForWorkspaceName,
  promptReplaceExistingProfile,
} from "./auth/handlers/prompts";
import * as open from "open";
import { PORT, startServer } from "../services/auth/server";
import { connect } from "./connect/handlers/handlers";
import { Stage } from "../services/api/paths/onboarding";
import { resolve } from "path";

export interface Options extends BaseOptions {
  email?: string;
  profile: string;
}

export const command = "login";
export const desc = "Obtain and save credentials for an environment";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      demo: { type: "boolean", desc: "Login with the demo user", default: false, hidden: true },
      profile: { type: "string", desc: "Alias of the profile", default: "default" },
    })
    .example([
      [
        `
      # Intercatively authenticate against Baselime:
      $0 login

      # Provide parameters on the command-line:
      $0 login --profile prod
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  let { demo, profile } = argv;

  welcome();

  try {
    const config = await readUserAuth(profile);
    if (config) {
      userConfigFound(profile);
      const res = await promptReplaceExistingProfile(profile);
      if (!res) {
        process.exit(0);
      }
    }
  } catch (_) {}

  let oathData = { id_token: "", otp: "" };
  let onboardingStatus;
  if (demo) {
    const email = "demo@baselime.io";
    const otp = await promptForOneTimePassword(email);
    oathData.otp = otp;
  } else {
    s.start("Redirecting to the browser...");
    const config = await api.getAuthConfig();
    const creds = await startServer(config, oathData.otp, argv);

    const loginUrl = `${config.url}/oauth2/authorize?client_id=${config.client}&response_type=code&scope=email+openid+phone+profile&redirect_uri=http://localhost:${PORT}`;
    await open.default(loginUrl);

    oathData.id_token = (await creds.getCreds()).id_token;
    const user = await creds.getUser();
    onboardingStatus = await api.getOnboardingStatus(oathData.id_token);

    s.succeed(`Welcome ${user.forname || "baselimer"}!`);
    if (!onboardingStatus?.stages.find((el) => el.id === "ACTIVATE")?.completed) {
      await api.editOnboardingStatus({
        token: oathData.id_token,
        stage: Stage.ACTIVATE,
        completed: true,
      });
    }
  }

  s.start("Fetching your workspaces...");
  const workspaces = await api.getWorkspaces(oathData.id_token, oathData.otp);
  if (!workspaces.length) {
    s.succeed();
    const workspaceName = await promptForWorkspaceName();
    s.start(`Creating workspace ${workspaceName}...`);
    const workspace = await api.createWorkspace(workspaceName, oathData.id_token);
    await api.editOnboardingStatus({
      token: oathData.id_token,
      stage: Stage.CREATE_WORKSPACE,
      completed: true,
    });

    s.succeed();

    workspaces.push(workspace);
  } else {
    s.succeed(`Welcome to ${workspaces[0].id}!`);
  }

  let { workspaceId, environmentId, isCreate } = await promptForEnvironment(workspaces);
  if (isCreate) {
    const provider = "aws";
    const alias = await promptEnvironmentAlias();
    const account = await promptAWSAccountId();
    const region = await promptAWSRegion();
    environmentId = alias;
    await connect("table", workspaceId, provider, { account, region }, alias, oathData.id_token);

    await api.editOnboardingStatus({
      token: oathData.id_token,
      stage: Stage.CONNECT_ENVIRONMENT,
      completed: true,
    });
  }

  s.start("Fetching your API key...");
  const apiKey = await api.getApiKey(workspaceId, environmentId, oathData.id_token, oathData.otp);
  const path = await writeUserAuth(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();
  await authenticate(profile);

  credentialsConfigured(path);
}
