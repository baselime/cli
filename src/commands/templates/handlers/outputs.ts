import Table from "cli-table3";

import { OutputFormat } from "../../../shared";
import chalk from "chalk";
import { Template } from "../../../services/api/paths/templates";

function create(template: Template, format: OutputFormat) {
  if (format === "json") {
    list([template], format);
    return;
  }
}

function list(templates: Template[], format: OutputFormat) {
  if (format === "json") {
    const table = new Table({
      head: ["Name", "Description", "Public", "Workspace ID"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
    });
    templates.forEach((template) => {
      table.push([template.name, template.description, template.public, template.workspaceId]);
    });
    console.log(table.toString());
    return;
  }
}

function get(template: Template, format: OutputFormat) {
  if (format === "json") {
    console.log(JSON.stringify(template));
    return;
  }
}

export default {
  create,
  list,
  get,
};
