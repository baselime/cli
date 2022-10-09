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

export async function promptReplaceExistingProfile(
  profile: string,
): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `Replace profile ${profile}?`,
  });

  return confirm;
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

  if (environments.length === 0) {
    throw new Error("No environment found. Please create at least one Baselime environment.");
  }

  const { environmentId } = await prompt<{ environmentId: string }>({
    type: "select",
    name: "environmentId",
    message: `Please select the environment`,
    choices: environments.map((env) => {
      return {
        name: env.id,
        message: `${chalk.cyan(chalk.bold(`${env.workspace} - ${env.alias}`))}`,
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
