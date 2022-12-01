import Table from "cli-table3";

import { OutputFormat, tableChars } from "../../../shared";
import chalk from "chalk";
import { Template } from "../../../services/api/paths/templates";

function create(template: Template, format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify(template , null, 4));
    return;
  }
}

export default {
  create,
};
