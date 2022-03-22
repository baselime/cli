import { outputJson, readJson } from "fs-extra";
import { homedir } from "os";
import { join } from "path";

export interface UserConfig {
  apiKey: string;
  workspace: string;
  environment: string;
}

export async function writeUserAuth(
  profile: string,
  userConfig: UserConfig,
): Promise<string> {
  const configPath = join(homedir(), ".config", "baselime", `${profile}.json`);
  await outputJson(configPath, userConfig);
  return configPath;
}

export async function readUserAuth(profile: string): Promise<UserConfig> {
  const configPath = join(homedir(), ".config", "baselime", `${profile}.json`);
  const userConfig = await readJson(configPath);
  return userConfig;
}
