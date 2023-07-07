import Table from "cli-table3";

import chalk from "chalk";
import dayjs from "dayjs";
import { Marker } from "../../services/api/paths/markers";
import { OutputFormat } from "../../shared";

function mark(data: { marker: Marker; format: OutputFormat }) {
  const { marker, format } = data;

  if (format === "json") {
    console.log(JSON.stringify(marker, null, 4));
    return;
  }
  const table = new Table({
    head: ["ID", "Start time", "Service", "URL"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });

  table.push([marker.id, marker.startTime, marker.service, marker.url]);
  console.log(table.toString());
}

export default {
  mark,
};
