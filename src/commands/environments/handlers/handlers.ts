import { createWriteStream } from "fs";
import api from "../../../services/api/api";
import spinner from "../../../services/spinner";
import { OutputFormat } from "../../../shared";
import https from "https";
import chalk from "chalk";

async function setup(format: OutputFormat, type: string, params: { account: string, region: string }, alias: string, otp: string) {
  const s = spinner.get();
  if (type !== "aws") {
    return console.log("Baselime currently only supports environments on AWS");
  }

    const randomString = Math.random().toString(20).substring(2, 8);

  s.start("Generating your CloudFormation template");
  const { url } = await api.cfTeamplateGenerate({
    otp,
    account: params.account,
    region: params.region,
    alias,
  });

  const filename = `baselime-environment-${params.account}-${params.region}.yaml`;
  const file = createWriteStream(filename);
  https.get(url, function (response) {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      s.succeed(`Template Generated ${process.cwd()}/${filename}`);
      console.log(chalk.bold("Run the following command to connect your AWS account to Baselime"));
      console.log(`Make sure you are using the AWS credentials for the account ${params.account} in ${params.region}`);
      console.log(`aws cloudformation create-stack \\
      --stack-name baselime-environment-${randomString} \\
      --capabilities CAPABILITY_NAMED_IAM \\
      --template-body file://${process.cwd()}/${filename}`);
    });
  });
}

export default {
  setup,
}