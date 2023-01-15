import { publicClient } from "../clients";

export interface Version {
  version: string;
}

export async function getLatestVersion(): Promise<Version> {
  const res = (await publicClient.get("/cli/version")).data;
  return res;
}

export default {
  getLatestVersion,
};
