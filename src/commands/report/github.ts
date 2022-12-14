import { readFile } from "fs-extra";
import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import { AlertCheck } from "../../services/api/paths/alert-checks";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, getVersion, printError } from "../../shared";
import outputs from "../alerts/handlers/outputs";
import { validateMetadata } from "../push/handlers/validators";

export interface Options extends BaseOptions {
  repo: string;
  "pull-request"?: number;
  commit?: string;
  path?: string;
  service?: string;
  config?: string;
  "github-token": string;
}

export const command = "github";
export const desc = "Post a Baselime report to GitHub";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      repo: { type: "string", desc: "Name of github repository", required: true },
      "pull-request": { type: "number", desc: "Pull-request number", required: false },
      "comnmit": { type: "string", desc: "Commit Id", required: false },
      "github-token": { type: "string", desc: "Token used to post the report on GitHub", required: true },
      path: { type: "string", desc: "Path to the Baselime output file", required: false },
      service: { type: "string", desc: "The service to create the report for. Defaults to the service specified in the .baselime folder, if it exists.", },
      config: { type: "string", desc: "The configuration folder to create the report for. This will be used to determine the service if no service is provided.", alias: "c", default: ".baselime", },
    })
    .example([
      [`
      # Post a report to GitHub:
      $0 github --repo <org/repo> --pull-request <pr-number> --github-token <girhub-token>

      # Post a report to GitHub with explicit path to Baselime output file:
      $0 github --repo <org/repo> --pull-request <pr-number> --path <path-to-baselime-output> --github-token <github-token>
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, repo, "pull-request": prNumber, "github-token": githubToken, path, commit, config } = argv;
  let { service } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  if (!commit && !prNumber) {
    throw new Error("Please specifiy either --commit or --pull-request");
  }
  const s = spinner.get();

  let status;
  if (path) {
    status = JSON.parse((await readFile(path)).toString()) as { version: string; service: string; alertChecks: AlertCheck[] };
  } else {
    service = service || (await validateMetadata(config!)).service;
    s.start("Checking...");
    const ids = (await api.alertsList(service)).map(alert => alert.id)
    const promises = ids.map(async id => { return await api.alertChecksCreate(service!, id, false) });

    const result = await Promise.all(promises);
    s.succeed("All alert checks completed");
    console.log();
    const checks = result.map(result => result.check);
    outputs.check(checks, "table");
    status = {
      version: getVersion(),
      alertChecks: checks,
      service,
    }
  }

  const [owner, name] = repo.split("/");

  console.log();
  s.start("Posting a report to GitHub...")
  await api.reportGithubCreate({
    repo: { name, owner },
    prNumber,
    commit,
    status,
    token: githubToken,
  })

  s.succeed("Report posted to GitHub");
}
