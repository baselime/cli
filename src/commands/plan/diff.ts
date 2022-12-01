import chalk from "chalk";
import { Ref } from "../../services/parser/parser";
import yaml from "yaml";

export function printDiff(diffObj: Record<string, any> | undefined): string {
  let string = yaml.stringify(diffObj);
  string = string.replace(/__old:[^\n]*/ig, (value) => {
    return chalk.redBright(value.replace("__old: ", "--"));
  });
  string = string.replace(/__new:?[^\n]*/ig, (value) => {
    return chalk.greenBright(value.replace(/__new:?\s*/, "++"));
  });
  string = string.replace(/- - "~"/ig, chalk.yellowBright("~~ changed"));
  string = string.replace(/- - \+/ig, chalk.greenBright("++ added"));
  string = string.replace(/- - "-"/ig, chalk.redBright("-- removed"));
  return string;
}