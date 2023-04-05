import { CreateChatCompletionRequest } from "openai/api";
import spinner from "../../services/spinner";
import { getTimeframe } from "../../services/timeframes/timeframes";
import { promptFrom, promptTo } from "../query/prompts/query";
import api from "../../services/api/api";
import { getLogger, randomString } from "../../utils";
import { prompt } from "enquirer";
import chalk from "chalk";
import crypto from "crypto";
import { QueryOperation } from "../../services/api/paths/queries";
import { promisify } from "util";
import { processEvents } from "./eventsVectors";
const wait = promisify(setTimeout);

const { Configuration, OpenAIApi } = require("openai");

type Command = {
  model?: string;
  query: string;
};

export async function analyse() {
  const from = await promptFrom();
  const to = await promptTo();

  let timeframe = getTimeframe(from, to);
  let datasets = ["apigateway-logs", "cloudtrail", "cloudwatch-metrics", "otel", "x-ray", "lambda-logs", "ecs-logs"];

  const filters = [
    {
      key: "LogLevel",
      operation: QueryOperation.EQUAL,
      type: "string",
      value: "ERROR",
    },
  ];

  let offset = 0;
  while (true) {
    const s = spinner.get();
    s.start("Collecting errors from your environment");
    const data = await api.listEvents({
      datasets: datasets,
      filters: filters,
      from: timeframe.from,
      to: timeframe.to,
      service: "default",
      offset: offset,
      limit: 100,
      needle: undefined,
    });
    console.log('data', data.events)
    s.succeed();
    s.start("Looking for distinct issues");
    const distinctIssues = processEvents(data.events);
    s.succeed();
    const nextPage = "Next page";
    const { name: errorToAnalyse } = await prompt<{ name: string }>({
      type: "select",
      name: "name",
      message: `${chalk.bold("Select an error to investigate")}`,
      choices: [
        ...distinctIssues.map((issue) => {
          const name = [
            chalk.white(`[x${issue.occurrences} times, last ${issue.lastOccurrence.toISOString()}]`),
            chalk.magenta(issue.dataset),
            chalk.yellow(issue.service),
            chalk.green(issue.namespace),
            issue.message,
          ].join(" ");
          return { name };
        }),
        { name: nextPage },
      ],
    });
    if (errorToAnalyse === nextPage) {
      offset++;
    } else {
      await askChatGPT(errorToAnalyse);
      return;
    }
  }
}

export async function askChatGPT(question: string) {
  const s = spinner.get();
  s.start("Explaining");
  const answer = await api.explain(question);
  s.succeed();
  const parts = ["\n", ...answer.split(" "), "\n"];
  for await (const part of parts) {
    process.stdout.write(`${part} `);
    // the "typing" effect
    await new Promise((res) => setTimeout(res, Math.random() * 100 + 100));
  }
}
