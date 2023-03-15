import * as fs from "fs";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { publicClient } from "../../../services/api/clients";
import { mkdirSync, rmdirSync } from "fs";
import { simpleGit } from "simple-git";
import yaml from "yaml";
import {getLogger} from "../../../utils";

// Finds metadata/index location
export async function readMetadataFile(directory: string): Promise<string> {
  let raw: string;
  try {
    getLogger().debug(`trying ${directory}/index.yaml`);
    raw = fs.readFileSync(`${directory}/index.yaml`).toString();
  } catch(err: any) {
    if (err.code == "ENOENT") {
      getLogger().debug(`index.yaml not found. Trying ${directory}/index.yml`);
      raw = fs.readFileSync(`${directory}/index.yml`).toString();
    } else {
      throw err;
    }
  }
  if (!raw) {
    getLogger().debug(`index file empty`);
    throw new Error("index file empty!");
  }
  return raw;
}

export async function uploadExtraAssets(directory: string, workspaceId: string, templateName: string) {
  const s = spinner.get();
  const readmePath = getReadmePath(directory);
  const licensePath = getLicensePath(directory);
  if (readmePath || licensePath) {
    s.info("Preparing to publish extra assets.");
    const data = await api.templateGetUploadUrl(workspaceId, templateName);
    if (readmePath) {
      s.info("Publishing README.md");
      const buf = fs.readFileSync(`${directory}/README.md`);
      await publicClient.put(data.readmeURL, buf, {
        headers: {
          "content-Type": "application/octet-stream",
        },
      });
    }
    if (licensePath) {
      s.info("Publishing LICENSE.md");
      const buf = fs.readFileSync(`${directory}/LICENSE.md`);
      await publicClient.put(data.licenseURL, buf, {
        headers: {
          "content-Type": "application/octet-stream",
        },
      });
    }
    s.succeed("Assets uploaded!");
  }
}

function getReadmePath(directory: string): string | undefined {
  const path = `${directory}/README.md`;
  if (fs.existsSync(path)) {
    return path;
  }
  return undefined;
}

function getLicensePath(directory: string): string | undefined {
  const path = `${directory}/LICENSE.md`;
  if (fs.existsSync(path)) {
    return path;
  }
  return undefined;
}

/**
 * Given URL fetches files from repository.
 * @param url - URL string to fetch
 * @returns path containing cloned files, or undefined if cloning failed
 */
export async function cloneRepo(url: string): Promise<string | undefined> {
  const s = spinner.get();
  const tempDirPath = "/tmp/baselime/git";
  rmdirSync(tempDirPath, { recursive: true });
  mkdirSync(tempDirPath, { recursive: true });
  const git = simpleGit("/tmp/baselime/git");
  s.start(`Fetching template from ${url}`);
  const cloneError = await git.clone(url!, tempDirPath);
  if (!cloneError) {
    return tempDirPath;
  }
  return undefined;
}
