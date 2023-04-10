import spinner from "../../services/spinner";
import { getTimeframe } from "../../services/timeframes/timeframes";
import { promptFrom, promptTo } from "../query/prompts/query";
import api from "../../services/api/api";
import { prompt } from "enquirer";
import chalk from "chalk";
import { QueryOperation } from "../../services/api/paths/queries";
import { EventsData, processEvents } from "./eventsVectors";

export async function explain() {
  const from = await promptFrom();
  const to = await promptTo();

  const timeframe = getTimeframe(from, to);
  const datasets = ["apigateway-logs", "cloudtrail", "cloudwatch-metrics", "otel", "x-ray", "lambda-logs", "ecs-logs"];

  const filters = [
    {
      key: "LogLevel",
      type: "string",
      operation: QueryOperation.IN,
      value: "ERROR, Error, error, FATAL, Fatal, fatal",
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
    s.succeed();
    s.start("Looking for distinct issues");
    const distinctIssues: EventsData[] = processEvents(data.events);
    s.succeed();
    // @ts-ignore
    const { name: selectedIndex } = await prompt<any>({
      type: "select",
      name: "name",
      message: `${chalk.bold("Select an error to investigate")}`,
      choices: [
        ...distinctIssues.map((issue, index) => {
          const name = [
            chalk.white(`[x${issue.occurrences} times, last ${issue.lastOccurrence.toISOString()}]`),
            chalk.magenta(issue.event._dataset),
            chalk.yellow(issue.event._service),
            chalk.green(issue.event._namespace),
            issue.summary,
          ].join(" ");
          return {
            name: index.toString(),
            message: name,
            value: issue.event,
          };
        }),
        {
          name: distinctIssues.length.toString(),
          message: "Next page",
          value: "Next page",
        },
      ],
    });
    if (selectedIndex >= distinctIssues.length) {
      offset++;
    } else {
      const selection: EventsData = distinctIssues[selectedIndex];
      await askAI(selection.combinedMessage, selection);
      return;
    }
  }
}

export async function askAI(message: string, selection: EventsData) {
  const s = spinner.get();
  // send question first, then print the question
  const answerPromise = api.explain(message);
  console.log();
  s.info("The error:");
  console.log(selection.combinedMessage);
  console.log();
  s.start("Explaining");
  const answer = await answerPromise;
  s.succeed();
  await imitateTyping(answer);
}

async function imitateTyping(message: string) {
  const parts = ["\n\n", ...message.split(" ")];
  for await (const part of parts) {
    process.stdout.write(`${part.trim()} `);
    // the "typing" effect
    await new Promise((res) => setTimeout(res, Math.random() * 100 + 100));
  }
}

