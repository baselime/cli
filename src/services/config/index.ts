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
    queries: {},
    alerts: {},
    dashboards: {},
  };

  const d = yaml.stringify(data);
  writeFileSync(filename, d);
}
