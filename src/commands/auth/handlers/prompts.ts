import { prompt } from "enquirer";
import * as yup from "yup";
import chalk from "chalk";
import { Workspace } from "../../../services/api/paths/auth";

export async function promptForEmail(): Promise<string> {
  const accountEmailSchema = yup.string().email().required();

  const { accountEmail } = await prompt<{ accountEmail: string }>({
    type: "input",
    name: "accountEmail",
    message: "What email address did you sign up to Baselime with?",
    required: true,
    validate: async (value) => {
      try {
        await accountEmailSchema.validate(value);
        return true;
      } catch (error) {
        return (error as any).message;
      }
    },
  });

  return accountEmail.trim();
}

export async function promptEnvironmentAlias(): Promise<string> {
  const { alias } = await prompt<{ alias: string }>({
    type: "input",
    name: "alias",
    message: "Name your environment",
    required: true,
    initial: "prod",
  });

  return alias.replace(/[^\w\s]/gi, "-");
}

export async function promptAWSAccountId(): Promise<string> {
  const { accountId } = await prompt<{ accountId: string }>({
    type: "input",
    name: "accountId",
    message: "Provide your AWS account ID",
    required: true,
    initial: "012345678912"
  });

  return accountId.replace(/[^\w\s]/gi, "-");
}

export async function promptAWSRegion(): Promise<string> {
  const regions = ["us-east-1", "us-east-2", "us-west-2", "eu-central-1", "eu-west-2", "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "eu-west-1"];

  const { region } = await prompt<{ region: string }>({
    type: "autocomplete",
    name: "region",
    message: "Which key to group by?",
    choices: regions.sort(),
  });

  return region;
}

export async function promptForOneTimePassword(email: string): Promise<string> {
  const otpSchema = yup.string().length(8).required();

  const { otp } = await prompt<{ otp: string }>({
    type: "password",
    name: "otp",
    message: `Please enter the verification code sent to ${email}`,
    required: true,
    validate: async (value) => {
      try {
        await otpSchema.validate(value);
        return true;
      } catch (error) {
        return (error as any).message;
      }
    },
  });

  return otp.trim();
}

export async function promptReplaceExistingProfile(profile: string): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `Replace profile ${profile}?`,
  });

  return confirm;
}

export async function promptRedirectToCloudFormation(): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: "Press [Enter] to be redirected to CloudFormation and deploy the Baselime connector stack",
  });

  return confirm;
}

export async function promptForEnvironment(workspaces: Workspace[]): Promise<{ isCreate: boolean; workspaceId: string; environmentId: string }> {
  const environments = workspaces.filter(w => w.environments).flatMap((workspace) => {
    return workspace.environments?.map((env: Record<string, any>) => {
      return {
        workspace: workspace.name,
        workspaceId: workspace.id,
        id: env.id,
      };
    });
  });

  const choices = environments.map((env) => {
    return {
      name: env.id,
      message: `${chalk.cyan(chalk.bold(`${env.workspace} - ${env.id}`))}`,
      value: env.id,
    };
  });
  const create = { name: "baselime-create-an-environment", message: "Create an environment", value: "baselime-create-an-environment" };
  const { environmentId } = await prompt<{ environmentId: string }>({
    type: "select",
    name: "environmentId",
    message: "Select one of your environments",
    choices: [create, ...choices],
    required: true,
    result(value) {
      return value;
    },
  });

  if (environmentId === create.value) {
    return { isCreate: true, workspaceId: workspaces[0].id, environmentId };
  }

  const environment = environments.find((env) => env.id === environmentId);
  return { isCreate: false, workspaceId: environment!.workspaceId, environmentId };
}

export async function promptForWorkspaceName(): Promise<string> {
  const defaultName = "acme-inc";
  let res = defaultName;
  do {
    const { workspace } = await prompt<{ workspace: string }>({
      type: "input",
      name: "workspace",
      message: "Create a workspace?",
      required: true,
      initial: defaultName,
    });
    res = workspace.replace(/[^\w\s]/gi, "-");
    if (res === "acme-inc") {
      console.log(`Enter a value different from ${defaultName}`);
    }
  } while (res === defaultName);

  return res;
}
