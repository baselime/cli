import { Query } from "../../services/api/paths/queries";
import Table from "cli-table3";
import { EOL } from "os";
import { tableChars } from "../../shared";
import chalk from "chalk";
import { Bin, QueryRun } from "../../services/api/paths/query-runs";
import dayjs from "dayjs";

const { BASELIME_DOMAIN = "baselime.io" } = process.env;

function list(queries: Query[], json: boolean) {
  if (json) {
    process.stdout.write(JSON.stringify({ queries }, null, 4));
    return;
  }
  const table = new Table({
    chars: tableChars,
    head: ["id", "application", "ref", "name", "created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });
  queries.forEach((query) => {
    table.push([query.id, query.application, query.ref, query.name, query.created]);
  });
  process.stdout.write(`${EOL}${table.toString()}${EOL}`);
  process.stdout.write(
    `${EOL}✨ ${chalk.bold(chalk.cyan(`${queries.length} queries${EOL}`))}`,
  );
}

function getQueryRun(queryRun: QueryRun, aggregates: Record<string, any>, bins: Bin[], events: Event[], json: boolean) {
  if (json) {
    process.stdout.write(JSON.stringify({ queryRun, aggregates, bins, events }, null, 4));
    return;
  }
  const runTable = new Table({
    chars: tableChars,
    head: ["id", "queryId", "from", "to", "status", "created"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });

  runTable.push([queryRun.id, queryRun.queryId, `${dayjs(queryRun.timeframe.from).format()}`, `${dayjs(queryRun.timeframe.to).format()}`, queryRun.status, queryRun.created]);

  const aggregatesTable = new Table({
    chars: tableChars,
    head: ["aggregate", "value"].map((e) => `${chalk.bold(chalk.cyan(e))}`),
  });

  Object.keys(aggregates).forEach((key: string) => {
    aggregatesTable.push([key, aggregates[key]]);
  });
  process.stdout.write(`${EOL}${runTable.toString()}${EOL}`);
  process.stdout.write(`${EOL}${aggregatesTable.toString()}${EOL}`);
  process.stdout.write(`${EOL}Follow this url: https://console.${BASELIME_DOMAIN}/workspaces/${queryRun.workspaceId}/envs/${queryRun.environmentId}/queries/${queryRun.queryId}/${queryRun.id}${EOL}`)
}

export default {
  list,
  getQueryRun,
};
