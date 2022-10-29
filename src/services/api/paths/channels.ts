import { client } from "../clients";

export interface Channel {
  workspaceId: string;
  environmentId: string;
  id: string;
  application: string;
  name: string;
  type: ChannelTypes;
  targets: string[];
  userId: string;
  created?: string;
  updated?: string;
}

export enum ChannelTypes {
  SLACK = "slack",
  WEBHOOK = "webhook",
}


async function channelsList(application?: string): Promise<Channel[]> {
  const res = (await client.get("/channels", { params: { application } })).data;
  return res.channels;
}

export default {
  channelsList,
};
