import { Arguments, CommandBuilder } from "yargs";
import api from "../services/api/api";
import { readUserAuth, writeUserAuth } from "../services/auth";
import spinner from "../services/spinner";
import { baseOptions, BaseOptions, printError } from "../shared";
import { credentialsConfigured, userConfigFound, welcome } from "./auth/handlers/outputs";
import { promptForEmail, promptForEnvironment, promptForOneTimePassword, promptReplaceExistingProfile } from "./auth/handlers/prompts";
import axios from "axios";
import * as express from "express";
import * as open from "open";
import { stringify } from "querystring"
import { promisify } from "util";
import ora from "ora";

const config = process.env.BASELIME_DOMAIN === 'baselime.io' ? {
  URL: 'https://baselime-prod.auth.eu-west-1.amazoncognito.com',
  PORT: process.env.PORT || '5678',
  CLIENT: '3ivhd1i3sevhbdb9d9ica67ksi'
} : {
  URL: 'https://baselime-uat.auth.eu-west-1.amazoncognito.com',
  PORT: process.env.PORT || '5678',
  CLIENT: '40abdb1vdns1enfhiqfd3jkqjj'
}

const loginUrl = `${config.URL}/oauth2/authorize?client_id=${config.CLIENT}&response_type=code&scope=email+openid+phone+profile&redirect_uri=http://localhost:${config.PORT}`
const template = (logout?: string) => /*html*/`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, width=device-width" />
  <title></title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-800 h-screen w-screen">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-4/6 flex ">
  <div class="mx-auto max-w-3xl flex flex-col justify-center">

  <div class="overflow-hidden rounded-lg bg-gray-900 shadow">
  <div class="px-4 py-5 sm:p-6 space-y-6 flex flex-col items-center">
  <h1 class="text-gray-100 text-2xl">Welcome to Baselime CLI</h1>
  ${logout ? /*html*/`
  <p class="text-gray-100">So you can log in with a different google account later please click this logout button</p>
  <a class="flex bg-lime-600 w-full py-4 px-8 rounded-md shadow" href="${logout}">Logout</a>
  ` : /*html*/`<p class="text-gray-100">Continue the setup in your terminal</p>`}
  </div>
  </div>
  </div>
  </div>
  </body>
</html>`

async function startServer(yargs: any): Promise<{ getCreds: () => Promise<{ id_token: string }> }> {
  return new Promise((resolve, reject) => {
    const app = express.default();

    let credentialStore = {
      creds: undefined,
      async getCreds(): Promise<any> {
        if (this.creds) {
          return this.creds
        }
        await promisify(setTimeout)(500)
        return await this.getCreds();
      }
    };
    app.get('/logout', (req, res) => {
      res.send(template())
    })

    app.get('/', async (req, res) => {
      const response = await axios.post(`${config.URL}/oauth2/token`, stringify({
        grant_type: 'authorization_code',
        client_id: config.CLIENT,
        redirect_uri: `http://localhost:${config.PORT}`,
        code: req.query.code?.toString()
      }))
      credentialStore.creds = response.data;
      res.send(template(`${config.URL}/logout?client_id=${config.CLIENT}&logout_uri=http://localhost:${config.PORT}/logout`))
    });

    app.listen(config.PORT, () => {
      resolve(credentialStore)
    }).on('error', (e) => {
      printError(`The CLI local server crashed because you have something running on ${config.PORT}. Run again with PORT=<free_port> baselime login`, e, yargs)
      reject(e)
    })
  })
}
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
      demo: { type: "boolean", desc: "Login with the demo user", default: false },
      profile: { type: "string", desc: "Alias of the profile", default: "default" },
    })
    .example([
      [`
      # Intercatively authenticate against Baselime:
      $0 login

      # Provide parameters on the command-line:
      $0 login --email hi@bob.lol --profile prod
      `]
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

async function loginDemo(s: ora.Ora, profile: string) {
  s.start(`Sending email verification request`);
  const email = "demo@baselime.io"
  await api.generateOneTimePassword(email);
  s.succeed();

  const otp = await promptForOneTimePassword(email);

  s.start("Checking your environments");
  const workspaces = await api.getWorkspacesByOneTimePassword(otp);
  s.succeed();

  const { workspaceId, environmentId } = await promptForEnvironment(workspaces);

  s.start("Setting up your workstation");
  const apiKey = await api.getApiKey(workspaceId, environmentId, otp);

  const path = await writeUserAuth(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();

  credentialsConfigured(path);

}
export async function handler(argv: Arguments<Options>) {
  const s = spinner.init(!!argv.quiet);

  let { demo, profile } = argv;

  welcome();
  if (demo) {
    return loginDemo(s, profile)
  }
  try {
    const config = await readUserAuth(profile);
    if (config) {
      userConfigFound(profile);
      const res = await promptReplaceExistingProfile(profile);
      if (!res) {
        process.exit(0);
      }
    }
  } catch (_) { }
  s.start(`Sending email verification request`);
  const creds = await startServer(argv);

  await open.default(loginUrl);

  const oathData = await creds.getCreds();
  s.succeed();

  s.start("Checking your environments");
  let workspaces = await api.getWorkspaces(oathData.id_token);
  s.succeed();

  const { workspaceId, environmentId } = await promptForEnvironment(workspaces);

  s.start("Setting up your workstation");
  const apiKey = await api.getApiKey(workspaceId, environmentId, undefined, oathData.id_token);
  const path = await writeUserAuth(profile, {
    apiKey,
    workspace: workspaceId,
    environment: environmentId,
  });
  s.succeed();

  credentialsConfigured(path);
}
