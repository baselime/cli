import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { OutputFormat } from "../../../shared";
import * as open from "open";
import { promptRedirectToCloudFormation } from "../../auth/handlers/prompts";
import { promisify } from "util";

const wait = promisify(setTimeout);

const taglines = [
  "Creating your connector CloudFormation stack",
  "Creating your Baselime IAM role",
  "Creating your Baselime S3 Bucket",
  "Creating your Baselime S3 Bucket",
  "Creating your Baselime CloudTrail",
  "Creating your Baselime CloudTrail",
  "Creating your Baselime CloudTrail",
  "Waiting for CloudFormation to deploy",
  "Waiting for CloudFormation to deploy",
  "Waiting for CloudFormation to deploy",
  "Waiting for CloudFormation to deploy",
  "Waiting for CloudFormation to deploy",
  "Creating your CloudWatch Metrics Stream Filters",
  "Creating your CloudWatch Metrics Stream Filters",
  "Creating your datasets",
  "Creating your datasets",
  "Creating your datasets",
  "Creating your Log Subscription Filters",
  "Creating your Log Subscription Filters",
  "Creating your Log Subscription Filters",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
  "Waiting for your telemetry data",
];

export async function connect(format: OutputFormat, workspaceId: string, provider: string, params: { account: string; region: string }, alias: string, token: string) {
  const s = spinner.get();
  if (provider !== "aws") {
    return console.log("We currently only supports connecting AWS accounts.");
  }

  s.start("Generating your CloudFormation template");
  const { url } = await api.awsConnect({
    workspaceId,
    token,
    account: params.account,
    region: params.region,
    alias,
  });

  s.succeed("Generated your CloudFormation template");
  const confirm = await promptRedirectToCloudFormation();
  if (!confirm) {
    return process.exit(0);
  }
  open.default(url);

  let index = 0;
  let success = false;
  do {
    const text = `${taglines[index]} (this should take less than 10mins)`;
    if (index === 0) {
      s.start(text);
    } else {
      s.text = text;
    }
    index += 1;
    await wait(20_000);
    try {
      const key = await api.getApiKey(workspaceId, alias, token);
      success = !!key;
    } catch (_) {
      //Swallow the error
    }
  } while (index < taglines.length && !success);

  if (!success) {
    s.fail(`Failed to verify the connection to ${alias}.\nVisit https://console.baselime.io/${workspaceId}/${alias} to verify in the console.`);
    return process.exit(1);
  }

  s.succeed(`Congrats! ${alias} has been successfully created`);
}

export default {
  connect,
};
