import spinner from "../../services/spinner";
import { getTimeframe } from "../../services/timeframes/timeframes";
import { promptFrom, promptTo } from "../query/prompts/query";
import api from "../../services/api/api";
import { prompt } from "enquirer";
import chalk from "chalk";
import { QueryOperation } from "../../services/api/paths/queries";
import {EventsData, processEvents} from "./eventsVectors";

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
            value: issue.event
          };
        }),
        {
          name: distinctIssues.length.toString(),
          message: "Next page",
          value: "Next page"
        },
      ],
    });
    if (selectedIndex >= distinctIssues.length) {
      offset++;
    } else {
      const selection: EventsData = distinctIssues[selectedIndex];
      await askChatGPT(selection.combinedMessage, selection);
      return;
    }
  }
}

export async function askChatGPT(question: string, selection: EventsData) {
  const s = spinner.get();
  // send question first, then print the question
  const answerPromise = api.explain(question);
  s.info(`Explaining:`);
  await imitateTyping(selection.combinedMessage);
  s.start("Getting answers");
  const answer = await answerPromise;
  s.succeed();
  await imitateTyping(answer);
}

async function imitateTyping(toPrint: string) {
  const parts = ["\n", ...toPrint.split(/(.)/g), "\n"];
  for await (const part of parts) {
    process.stdout.write(part);
    // the "typing" effect
    await new Promise((res) => setTimeout(res, randomIntFromInterval(20, 25)));
  }
}

function randomIntFromInterval(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}
