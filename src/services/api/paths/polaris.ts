import { client, publicClient } from "../clients";

async function uplaod(preSignedUrl: string, data: string) {
  await publicClient.put(preSignedUrl, data, {
    headers: {
      "content-Type": "application/x-yaml",
    },
  });
}

async function getUploadUrl(
  application: string,
  version: string,
): Promise<{ url: string; id: string }> {
  const res = (
    await client.put("/polaris/upload-url", { application, version })
  ).data;
  return res;
}

export default {
  getUploadUrl,
  uplaod,
};
