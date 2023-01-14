import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { baseOptions, BaseOptions, printError } from "../../shared";
import { commonHandler } from "./handlers/common";

export interface Options extends BaseOptions {
	channel: string;
	path?: string;
	service?: string;
	config?: string;
}

export const command = "slack";
export const desc = "Post a Baselime report to Slack";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
	return yargs
		.options({
			...baseOptions,
			channel: {
				type: "string",
				desc: "The name of the Slack channel to post to",
				required: true,
			},
			path: {
				type: "string",
				desc: "Path to the Baselime output file",
				required: false,
			},
			service: {
				type: "string",
				desc: "The service to create the report for. Defaults to the service specified in the .baselime folder, if it exists.",
			},
			config: {
				type: "string",
				desc: "The configuration folder to create the report for. This will be used to determine the service if no service is provided.",
				alias: "c",
				default: ".baselime",
			},
		})
		.example([
			[
				`
      # Post a report to Slack:
      $0 slack --channel <channel>

      # Post a report to Slack with explicit path to Baselime output file:
      $0 slack --channel <channel> --path <path-to-baselime-output>
      `,
			],
		])
		.fail((message, err, yargs) => {
			printError(message, err, yargs);
		});
};

export async function handler(argv: Arguments<Options>) {
	const { profile, channel, path, config, quiet, service } = argv;

	let status = await commonHandler(profile, quiet, path, config, service);

	const s = spinner.get();

	s.start("Checking your Slack workspace");
	const workspace = await api.slackWorkspaceGet();

	if (!workspace.slackTeamId) {
		s.fail(
			"Please install the Baselime slack app and follow the setup instructions to send reports to Slack.",
		);
		console.log("Docs: https://docs.baselime.io/integrations/slack/overview/");
		return;
	}

	s.info("Posting a report to Slack...");
	await api.reportSlackCreate({
		status,
		channel,
	});

	s.succeed("Report posted to Slack");
}
