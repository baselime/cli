import { prompt } from "enquirer";
import { Variable } from "../../../services/api/paths/templates";
import spinner from "../../../services/spinner";

export async function promptReplaceExistingConfig(
  filename: string,
): Promise<boolean> {
  const { confirm } = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: `Replace config folder ${filename}?`,
  });

  return confirm;
}
export async function promptTemplateVariables(variables: Variable[]): Promise<Record<string, any>> {
  const s = spinner.get();
  s.info("Please enter the values for the variables in this template");
  const res = await prompt<Record<string, any>>(variables.map(variable => {
    let type = "input";
    switch (variable.type) {
      case "string":
        type = "input";
        break;
      case "number":
        type = "number";
        break;
      case "boolean":
        type = "question";
        break;
      default:
        break;
    }
    return {
      type,
      name: variable.ref,
      message: `Variable: ${variable.ref}\n${variable.description}`,
    }
  }));

  return res;
}
