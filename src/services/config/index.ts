import { writeFileSync } from "fs";
const packageJson = require("../../../package.json");
import { readdir } from "fs/promises";
import { Ref, stringify } from "../parser/parser";

export async function init(
  folder: string,
  application: string,
  description: string,
  email: string,
) {
  const metadata = {
    version: packageJson.version,
    application,
    description,
  };

  const d = stringify(metadata);
  writeFileSync(`${folder}/index.yml`, d);

  const data = {
    "lambda-cold-start-durations": {
      type: "query",
      properties: {
        name: "Duration of lambda cold-starts",
        description: "How long do cold starts take on our API?",
        parameters: {
          dataset: "logs",
          calculations: [
            "MAX(@initDuration)",
            "MIN(@initDuration)",
            "AVG(@initDuration)",
            "P99(@initDuration)",
            "COUNT"
          ],
          filters: [
            "@type := REPORT"
          ],
          filterCombination: "AND",
        }
      }
    },
    "critical-cold-start-duration": {
      type: "alert",
      properties: {
        name: "Lambda cold-starts take more than 2 seconds",
        parameters: {
          query: new Ref("lambda-cold-start-durations"),
          frequency: 30,
          duration: 30,
          threshold: ":> 2000",
        },
        channels: [new Ref("developers")]
      }
    },
    developers: {
      type: "channel",
      properties: {
        type: "email",
        targets: [
          email
        ]
      }
    }
  };

  const dd = stringify(data);
  writeFileSync(`${folder}/demo.yml`, dd);
}

export async function getFileList(dirName: string) {
  let files: string[] = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [
        ...files,
        ...(await getFileList(`${dirName}/${item.name}`)),
      ];
    } else {
      files.push(`${dirName}/${item.name}`);
    }
  }

  return files;
};
