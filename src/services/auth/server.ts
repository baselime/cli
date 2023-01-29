import axios from "axios";
import * as express from "express";
import { stringify } from "querystring";
import { promisify } from "util";
import { printError } from "../../shared";
import api from "../api/api";

export const PORT = "5678";

const template = (name: string, logout?: string) => /*html*/ `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, width=device-width" />
  <title></title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap" rel="stylesheet">
</head>
<body class="h-screen w-screen" style="background: #151515">
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 h-4/6 flex ">
    <div class="mx-auto max-w-3xl flex flex-col justify-center">

      <div class="overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:p-6 space-y-6 flex flex-col items-center">
          <div>
            <img src="https://cli-assets.baselime.cc/baselime_celebrations@2x.png" class="h-40 w-40 mb-6"/>
          </div>
          <h1 class="text-white text-4xl" style="font-family: 'Poppins', sans-serif;">Welcome ${name || 'baselimer'}!</h1>
          <p class="text-white text-center" style="font-family: 'Poppins', sans-serif;">Return to your terminal to setup your environment and start with Continuous Observability.</p>
         </div>
      </div>
    </div>
  </div>
  ${
    logout
      ? `<script>
      window.location.href = "${logout}"; 
    </script>`
      : ""
  }
</body>
</html>`;

export async function startServer(config: { url: string; client: string }, otp: string, yargs: any): Promise<{ getCreds: () => Promise<{ id_token: string }>, getUser: () => Promise<{ forname: string; surname: string; email: string; id: string; image: string }> }> {
  return new Promise((resolve, reject) => {
    const app = express.default();

    let user = {} as any;
    const credentialStore = {
      creds: undefined,
      user: undefined,
      async getCreds(): Promise<any> {
        if (this.creds) {
          return this.creds;
        }
        await promisify(setTimeout)(500);
        return await this.getCreds();
      },
      async getUser(): Promise<{ forname: string; surname: string; email: string; id: string; image: string }> {
        if (this.user) {
          return this.user;
        }
        await promisify(setTimeout)(500);
        return await this.getUser();
      },
    };
    app.get("/logout", (req, res) => {
      res.send(template(user.forname));
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
      user = await api.getAuthIam(response.data.id_token, otp);
      credentialStore.creds = response.data;
      credentialStore.user = user;
      res.send(template(user.forname, `${config.url}/logout?client_id=${config.client}&logout_uri=http://localhost:${PORT}/logout`));
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
