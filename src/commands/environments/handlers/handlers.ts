import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { OutputFormat } from "../../../shared";

async function setup(format: OutputFormat, type: string, params: { account: string, region: string }, alias: string, otp: string) {
  const s = spinner.get();
  if (type !== "aws") {
    return console.log("Baselime currently only supports environments on AWS");
  }

  s.start("Generating your CloudFormation template");
  const { url } = await api.awsConnect({
    otp,
    account: params.account,
    region: params.region,
    alias,
  });

  s.succeed("Generated your CloudFormation template");
  console.log(`Follow this url to complete seting up your AWS Account`);
  console.log(url);
}

export default {
  setup,
}