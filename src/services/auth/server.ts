import axios from "axios";
import * as express from "express";
import { stringify } from "querystring";
import { promisify } from "util";
import { printError } from "../../shared";

export const PORT = "5678";

const template = (logout?: string) => /*html*/ `<!DOCTYPE html>
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
  ${
    logout
      ? /*html*/ `
  <p class="text-gray-100">You're now logged in</p>
  <a class="flex bg-lime-600 w-full py-4 px-8 justify-center rounded-md shadow" href="${logout}">Continue</a>
  `
      : /*html*/ `<p class="text-gray-100">Continue the setup in your terminal</p>`
  }
  </div>
  </div>
  </div>
  </div>
  </body>
</html>`;

export async function startServer(config: { url: string; client: string }, yargs: any): Promise<{ getCreds: () => Promise<{ id_token: string }> }> {
  return new Promise((resolve, reject) => {
    const app = express.default();

    let credentialStore = {
      creds: undefined,
      async getCreds(): Promise<any> {
        if (this.creds) {
          return this.creds;
        }
        await promisify(setTimeout)(500);
        return await this.getCreds();
      },
    };
    app.get("/logout", (req, res) => {
      res.send(template());
    });

    app.get("/", async (req, res) => {
      const response = await axios.post(
        `${config.url}/oauth2/token`,
        stringify({
          grant_type: "authorization_code",
          client_id: config.client,
          redirect_uri: `http://localhost:${PORT}`,
          code: req.query.code?.toString(),
        }),
      );
      credentialStore.creds = response.data;
      res.send(template(`${config.url}/logout?client_id=${config.client}&logout_uri=http://localhost:${PORT}/logout`));
    });

    app
      .listen(PORT, () => {
        resolve(credentialStore);
      })
      .on("error", (e) => {
        printError(`The CLI local server crashed because you have something running on ${PORT}. Please try again as  $PORT=<free_port> baselime login`, e, yargs);
        reject(e);
      });
  });
}
