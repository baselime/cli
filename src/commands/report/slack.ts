import { Arguments, CommandBuilder } from "yargs";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { baseOptions, BaseOptions, printError } from "../../shared";
import { commonHandler } from "./handlers/common";

export interface Options extends BaseOptions {
  channel: string;
  path?: string;
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
  const { channel, path, quiet, } = argv;

  let status = await commonHandler(quiet, path);

  const s = spinner.get();

  s.start("Checking your Slack workspace");
  const workspace = await api.slackWorkspaceGet();

  if (!workspace.slackTeamId) {
    s.fail("Please install the Baselime slack app and follow the setup instructions to send reports to Slack.");
    console.log("Docs: https://baselime.io/docs/integrations/slack/overview/");
    return;
  }

  s.info("Posting a report to Slack...");
  await api.reportSlackCreate({
    status,
    channel,
  });

  s.succeed("Report posted to Slack");
}
