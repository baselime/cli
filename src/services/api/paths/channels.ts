import { client } from "../clients";

export interface Channel {
  workspaceId: string;
  environmentId: string;
  id: string;
  application: string;
  ref: string;
  name: string;
  type: ChannelTypes;
  targets: string[];
  userId: string;
  created?: string;
  updated?: string;
}

export enum ChannelTypes {
  EMAIL = "email",
}


async function channelsList(application?: string, ref?: string): Promise<Channel[]> {
  const res = (await client.get("/channels", { params: { application, ref } })).data;
  return res.channels;
}

export default {
  channelsList,
};
