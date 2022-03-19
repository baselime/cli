import { prompt } from "enquirer";
import * as yup from "yup";
import { Workspace } from "../../services/api/auth/auth";
import chalk from "chalk";

export async function promptForEmail(): Promise<string> {
  const accountEmailSchema = yup.string().email().required();

  const { accountEmail } = await prompt<{ accountEmail: string }>({
    type: "input",
    name: "accountEmail",
    message: "What email address did you sign up with?",
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

  return accountEmail;
}

export async function promptForOneTimePassword(email: string): Promise<string> {
  const otpSchema = yup.string().length(8).required();

  const { otp } = await prompt<{ otp: string }>({
    type: "input",
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

  return otp;
}

export async function promptForEnvironment(
  workspaces: Workspace[],
): Promise<{ workspaceId: string; environmentId: string }> {
  const environments = workspaces
    .map((workspace) => {
      return workspace.environments?.map((env: Record<string, any>) => {
        return {
          workspace: workspace.name,
          workspaceId: workspace.id,
          id: env.id,
          alias: env.alias,
        };
      });
    })
    .flat();

  const { environmentId } = await prompt<{ environmentId: string }>({
    type: "select",
    name: "environmentId",
    message: `Please select the environment`,
    choices: environments.map((env) => {
      return {
        name: env.id,
        message: `${chalk.green(
          chalk.bold(`${env.workspace} - ${env.alias}`),
        )}`,
        value: env.id,
      };
    }),
    required: true,
    result(value) {
      return value;
    },
  });

  const environment = environments.find((env) => env.id === environmentId);
  return { workspaceId: environment!.workspaceId, environmentId };
}
