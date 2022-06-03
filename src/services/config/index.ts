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
      "lambda-invocations-durations": {
        name: "The duration of lambda invocations",
        description: "Statistics on the duration of lambda invocations across the stack",
        parameters: {
          dataset: "logs",
          calculations: [
            "MAX(@duration)",
            "MIN(@duration)",
            "AVG(@duration)",
            "P99(@duration)",
          ],
          filters: [
            "@message := REPORT"
          ],
          filterCombination: "AND",
        }
      },
    },
    alerts: {
      "long-lambda-invocations": {
        name: "A Lambda invocation lasted more than 15seconds",
        parameters: {
          query: "lambda-invocations-durations",
          frequency: 30,
          duration: 30,
          threshold: ":> 15000",
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
