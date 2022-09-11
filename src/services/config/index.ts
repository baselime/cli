import { readdir } from "fs/promises";
import path from "path";


export async function getFileList(dirName: string, extensions: string[]) {
  let files: string[] = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [
        ...files,
        ...(await getFileList(`${dirName}/${item.name}`, extensions)),
      ];
    } else if (item.isFile()) {
      if (!extensions.includes(path.extname(item.name))) {
        continue;
      }
      files.push(`${dirName}/${item.name}`);
    }
  }

  return files;
};
