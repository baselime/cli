import { client } from "../clients";
import { AlertCheck } from "./alert-checks";

export interface GitHubReportData {
  repo: { owner: string; name: string };
  prNumber?: number;
  commit?: string;
  status: { version: string; alertChecks: AlertCheck[]; };
  token: string;
}

export interface SlackReportData {
  channel: string;
  status: { version: string; alertChecks: AlertCheck[]; };
}

async function reportGithubCreate(data: GitHubReportData): Promise<boolean> {
  const {
    repo: { owner, name },
    prNumber,
    commit,
    status,
    token,
  } = data;
  await client.post("/reports/github", {
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

async function reportSlackCreate(data: SlackReportData): Promise<boolean> {
  const { channel, status } = data;
  await client.post("/reports/slack", {
    status,
    channel,
  });
  return true;
}

export default {
  reportGithubCreate,
  reportSlackCreate,
};
