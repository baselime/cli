import { client } from "../clients";
import { AlertCheck } from "./alert-checks";

export interface GitHubReportData {
  repo: { owner: string, name: string };
  prNumber?: number;
  commit?: string;
  status: { version: string; alertChecks: AlertCheck[]; service: string };
  token: string;
}

async function reportGithubCreate(data: GitHubReportData): Promise<boolean> {
  const { repo: { owner, name }, prNumber, commit, status, token } = data;
  await client.post(`/reports/github`, {
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
  reportGithubCreate,
};
