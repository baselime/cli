import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { OutputFormat } from "../../../shared";
import * as open from "open";

async function connect(format: OutputFormat, provider: string, params: { account: string; region: string }, alias: string, otp: string) {
  const s = spinner.get();
  if (provider !== "aws") {
    return console.log("We currently only supports connecting AWS accounts.");
  }

  s.start("Generating your CloudFormation template");
  const { url } = await api.awsConnect({
    otp,
    account: params.account,
    region: params.region,
    alias,
  });

  s.succeed("Generated your CloudFormation template");
  console.log("Please follow the steps in your web browser to complete connecting up your AWS Account");
  open.default(url);
}

export default {
  connect,
};
