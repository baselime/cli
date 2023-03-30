import {CreateChatCompletionRequest} from "openai/api";
import spinner from "../../services/spinner";
import {getTimeframe} from "../../services/timeframes/timeframes";
import {promptFrom, promptTo} from "../query/prompts/query";
import api from "../../services/api/api";
import {getLogger, randomString} from "../../utils";
import {prompt} from "enquirer";
import chalk from "chalk";
import crypto from "crypto";

const {Configuration, OpenAIApi} = require("openai");

type Command = {
    model?: string;
    query: string;
}

export async function generate(apiKey: string, cmd: Command) {
    const prompt = `You are an engineer experienced in Amazon Web Services. Please explain the following error:` + cmd.query;
    const configuration = new Configuration({
        apiKey,
    });
    const openAiRequest: CreateChatCompletionRequest = {
        model: !cmd.model ? "gpt-3.5-turbo" : cmd.model!,
        messages: [
            {
                role: "user",
                content: prompt,
            }
        ],
        temperature: 0.5,
        max_tokens: 2000
    };
    const openai = new OpenAIApi(configuration);
    const s = spinner.get();
    s.start("Getting answers");
    const response = await openai.createChatCompletion(openAiRequest);
    s.succeed();
    const text = response.data.choices[0].message.content;
    console.log(text);
}

export async function loadAndSelectEvent(queryId: string, runId: string): Promise<string | undefined> {
    const s = spinner.get();
    getLogger().debug(`Getting events for query ${queryId}, runId: ${runId}`);
    s.start("Getting the events");
    let result;
    let attempt = 0;
    while (attempt < 5 && !result) {
        attempt++;
        try {
            result = await api.queryRunGet({
                queryId: queryId,
                events: true,
                limit: 20,
                service: "default",
                id: runId
            });
        } catch (e) {
            getLogger().debug(`attempt ${attempt} failed: ${e}`);
        }
        await new Promise(res => setTimeout(res, 3000));
    }
    if (!result) {
        s.fail("Failed to get events for your query after 5 attempts :(");
        return
    }

    const dict: Record<string, any> = {};
    result.events.filter(event => {
        const hashId = crypto.createHash("sha1").update(event._parsed.error).digest("base64");
        if (!dict[hashId]) {
            dict[hashId] = event;
            return true;
        }
        return false;
    });
    const distinctIssues = [];
    for (const key of Object.keys(dict)) {
        distinctIssues.push(dict[key]);
    }
    s.succeed();
    if (distinctIssues.length < 1) {
        s.info("No issues found");
        return;
    }
    const choices = distinctIssues.map(event => {
        try {
            const msg = {
                dataset: event._dataset,
                service: event._service,
                message: event._parsed.msg,
                error: event._parsed.error,
            };
            return {
                name: JSON.stringify(msg)
            }
        } catch (e) {
            return {
                name: JSON.stringify(event._source)
            }
        }
    });
    const { name } = await prompt<{ name: string }>({
        type: "select",
        name: "name",
        message: `${chalk.bold("Select an issue to investigate")}`,
        choices: choices.slice(0, 10)
    });
    return JSON.parse(name).error;
}

type AnalysisResult = {
    queryId: string,
    runId: string
}

export async function analyse(): Promise<AnalysisResult>  {
    const from = await promptFrom();
    const to = await promptTo();

    let timeframe = getTimeframe(from, to);
    let datasets = [
        "apigateway-logs",
        "cloudtrail",
        "cloudwatch-metrics",
        "otel",
        "x-ray",
        "lambda-logs",
        "ecs-logs",
    ];

    const filters = [{
        key: "error",
        operation: "EXISTS",
        type: "string",
        value: "",
    }];

    const calculations = [{operator: "COUNT", key: ""}];


    const s = spinner.get();
    s.start("Analysing your systems");
    const queryId = `new-query-${randomString(6)}`;
    //@ts-ignore
    const {
        queryRun,
        calculations: {aggregates, series},
        events,
    } = await api.queryRunCreate({
        service: "default",
        queryId,
        timeframe,
        parameters: {
            datasets,
            calculations,
            filters,
        },
    });
    s.succeed();
    return {
        queryId,
        runId: queryRun.id.toString()
    }
}