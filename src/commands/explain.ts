import {Arguments, CommandBuilder} from "yargs";
import {authenticate, BaseOptions, baseOptions, printError} from "../shared";
import spinner from "../services/spinner";
import {Options} from "./query";
import {analyse, generate, loadAndSelectEvent} from "./explain/explain";
import {prompt} from "enquirer";
import chalk from "chalk";

export const command = "explain";
export const desc = "Investigate and explain current system issues";

export const builder: CommandBuilder<BaseOptions, BaseOptions> = (yargs) => {
    return yargs
        .options({
            ...baseOptions,
            openAIKey: { type: "string", desc: "OpenAI API key", demandOption: true },
        })
        .example([
            [
                `
        # Run a command using ai
        $0 ai create alert
    `,
            ],
        ])
        .fail((message, err, yargs) => {
            printError(message, err, yargs);
        });
};

export async function handler(argv: Arguments<Options>) {
    let { profile, openAIKey } = argv;

    spinner.init(!!argv.quiet);
    await authenticate(profile);

    const analysisResult = await analyse();
    const errorToAnalyse = await loadAndSelectEvent(analysisResult.queryId, analysisResult.runId);
    if (errorToAnalyse) {
        const { confirm } = await prompt<{ confirm: boolean }>({
            type: "confirm",
            name: "confirm",
            message: `${chalk.bold("Would you like to ask ChatGPT about the following issue?")}: ${errorToAnalyse}`,
        });
        if (confirm) {
            await generate(openAIKey as string, {
                query: errorToAnalyse,
            });
        }
    }
}