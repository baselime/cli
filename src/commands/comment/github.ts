import { readFile } from "fs-extra";
import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import { AlertCheck } from "../../services/api/paths/alerts";
import spinner from "../../services/spinner";
import { authenticate, baseOptions, BaseOptions, printError } from "../../shared";

export interface Options extends BaseOptions {
  repo: string;
  "pull-request"?: number;
  commit?: string;
  path: string;
  "github-token": string;
}

export const command = "github";
export const desc = "Post a Baselime comment to GitHub";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs
    .options({
      ...baseOptions,
      repo: { type: "string", desc: "Name of github repository", required: true },
      "pull-request": { type: "number", desc: "Pull-request number", required: false },
      "comnmit": { type: "string", desc: "Commit Id", required: false },
      "github-token": { type: "string", desc: "Token used to post the GitHub comment", required: true },
      path: { type: "string", desc: "Path to the Baselime output file", required: true },
    })
    .example([
      [`
      # Post a comment to GitHub:
      $0 github --repo <org/repo> --pull-request <pr-number> --path <path-to-baselime-output> --github-token <girhub-token>
      `],
    ])
    .fail((message, err, yargs) => {
      printError(message, err, yargs);
    });
};

export async function handler(argv: Arguments<Options>) {
  const { profile, repo, "pull-request": prNumber, "github-token": githubToken, path, commit } = argv;
  spinner.init(!!argv.quiet);
  await authenticate(profile);

  if (!commit && !prNumber) {
    throw new Error("Please specifiy either --commit or --pull-request");
  }

  const status = JSON.parse((await readFile(path)).toString()) as { version: string; application: string; alertChecks: AlertCheck[] };

  const [owner, name] = repo.split("/");
  await api.commentGithub({
    repo: { name, owner },
    prNumber,
    commit,
    status,
    token: githubToken,
  })

  console.log("Comment posted to github")
}
