import { writeFileSync } from "fs";
import yaml from "yaml";
const packageJson = require("../../../package.json");

export async function init(
  filename: string,
  application: string,
  description: string,
) {
  const data = {
    version: packageJson.version,
    application,
    description,
    queries: {
      "lambda-cold-start-duration": {
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
            "@message := REPORT"
          ],
          filterCombination: "AND",
        }
      },
    },
    alerts: {
      "critical-cold-start-duration": {
        name: "Lambda cold-starts take more than 2 seconds",
        parameters: {
          query: "lambda-cold-start-durations",
          frequency: 30,
          duration: 30,
          threshold: ":> 2000",
        },
        channels: ["developers"]
      }
    },
    channels: {
      developers: {
        type: "email",
        targets: [
          "example@email.com"
        ]
      }
    },
  };

  const d = yaml.stringify(data);
  writeFileSync(filename, d);
}
