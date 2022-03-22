import { prompt } from "enquirer";
import * as yup from "yup";

export async function application(): Promise<string> {
  const applicationEmailSchema = yup
    .string()
    .matches(/^[a-zA-Z0-9-_]+$/)
    .required();

  const { application } = await prompt<{ application: string }>({
    type: "input",
    name: "application",
    message: "Application name",
    required: true,
    validate: async (value) => {
      try {
        await applicationEmailSchema.validate(value);
        return true;
      } catch (error) {
        return (error as any).message;
      }
    },
  });

  return application;
}

export async function description(): Promise<string> {
  const descriptionSchema = yup.string();

  const { description } = await prompt<{ description: string }>({
    type: "input",
    name: "description",
    message: `Application description`,
    validate: async (value) => {
      try {
        await descriptionSchema.validate(value);
        return true;
      } catch (error) {
        return (error as any).message;
      }
    },
  });

  return description;
}

export async function promptReplaceExistingConfig(
  filename: string,
): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `Replace config file ${filename}?`,
  });

  return confirm;
}
