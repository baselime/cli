import { client } from "../clients";

export interface SlackWorkspace {
  id: string;
  members: Record<string, any>[];
  environments?: string[];
  slackTeamId?: string;
}

async function slackWorkspaceGet(): Promise<SlackWorkspace> {
  const res = (await client.get("/slack/workspace")).data;
  return res.workspace;
}

export default {
  slackWorkspaceGet,
};
