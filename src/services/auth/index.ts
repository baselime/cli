import { outputJson, readJson, remove } from "fs-extra";
import { homedir } from "os";
import { join } from "path";

export interface UserConfig {
  apiKey: string;
  workspace?: string;
  environment?: string;
}

export async function writeUserAuth(profile: string, userConfig: UserConfig): Promise<string> {
  const configPath = getAuthProfilePath(profile);
  await outputJson(configPath, userConfig);
  return configPath;
}

export async function deleteUserAuth(profile: string): Promise<string> {
  const configPath = getAuthProfilePath(profile);
  await remove(configPath);
  return configPath;
}

export async function readUserAuth(profile: string, apiKey?: string): Promise<UserConfig> {
  if (apiKey) return { apiKey };
  const { BASELIME_API_KEY: key } = process.env;
  if (key) return { apiKey: key };
  const configPath = getAuthProfilePath(profile);
  const userConfig = await readJson(configPath);
  return userConfig;
}

export function getAuthProfilePath(profile: string) {
  return join(homedir(), ".config", "baselime", `${profile}.json`);
}
