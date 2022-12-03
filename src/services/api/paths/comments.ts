import { client } from "../clients";
import { AlertCheck } from "./alert-checks";

export interface GitHubCommentData {
  repo: { owner: string, name: string };
  prNumber?: number;
  commit?: string;
  status: { version: string; alertChecks: AlertCheck[]; service: string };
  token: string;
}

async function commentGithub(data: GitHubCommentData): Promise<boolean> {
  const { repo: { owner, name }, prNumber, commit, status, token } = data;
  await client.post(`/comments/github`, {
    repo: {
      owner,
      name,
    },
    prNumber,
    commit,
    status,
    token,
  });
  return true;
}

export default {
  commentGithub,
};
