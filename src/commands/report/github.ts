import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { baseOptions, BaseOptions, printError } from "../../shared";
import { commonHandler } from "./handlers/common";

export interface Options extends BaseOptions {
  repo: string;
  "pull-request"?: number;
  commit?: string;
  path?: string;
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
      commit: { type: "string", desc: "Commit Id", required: false },
      "github-token": { type: "string", desc: "Token used to post the report on GitHub", required: true },
      path: { type: "string", desc: "Path to the Baselime output file", required: false },
    })
    .example([
      [
        `
      # Post a report to GitHub:
      $0 github --repo <org/repo> --pull-request <pr-number> --github-token <github-token>

      # Post a report to GitHub with explicit path to Baselime output file:
      $0 github --repo <org/repo> --pull-request <pr-number> --path <path-to-baselime-output> --github-token <github-token>
      `,
      ],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { repo, "pull-request": prNumber, "github-token": githubToken, path, commit, quiet } = argv;

  if (!(commit || prNumber)) {
    throw new Error("Please specifiy either --commit or --pull-request");
  }
  let status = await commonHandler(quiet, path);
  const [owner, name] = repo.split("/");

  const s = spinner.get();

  s.start("Posting a report to GitHub...");
  await api.reportGithubCreate({
    repo: { name, owner },
    prNumber,
    commit,
    status,
    token: githubToken,
  });

  s.succeed("Report posted to GitHub");
}
