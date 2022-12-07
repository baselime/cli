import * as fs from "fs";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { publicClient } from "../../../services/api/clients";

export async function uploadExtraAssets(directory: string, workspaceId: string, templateName: string) {
  const s = spinner.get();
  const readmePath = getReadmePath(directory);
  const licensePath = getLicensePath(directory);
  if(readmePath || licensePath) {
    s.info("preparing to publish extra assets");
    const data = await api.templateGetUploadUrl(workspaceId, templateName);
    if(readmePath) {
      s.info("publishing README.md");
      const buf = fs.readFileSync(`${directory}/README.md`);
      await publicClient.put(data.readmeURL, buf, {
        headers: {
          "content-Type": "application/octet-stream",
        },
      });
    }
    if(licensePath) {
      s.info("publishing LICENSE.md");
      const buf = fs.readFileSync(`${directory}/LICENSE.md`);
      await publicClient.put(data.licenseURL, buf, {
        headers: {
          "content-Type": "application/octet-stream",
        },
      });
    }
  }

}

function getReadmePath(directory: string): string | undefined {
  const path = `${directory}/README.md`
  if(fs.existsSync(path)) {
    return path
  }
  return undefined;
}

function getLicensePath(directory: string): string | undefined {
  const path = `${directory}/LICENSE.md`
  if(fs.existsSync(path)) {
    return path
  }
  return undefined;
}
