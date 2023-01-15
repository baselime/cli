import { prompt } from "enquirer";

export async function promptReplaceExistingConfig(filename: string): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `Replace config folder ${filename}?`,
  });

  return confirm;
}
