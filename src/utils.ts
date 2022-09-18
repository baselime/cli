import { QueryFilter } from "./services/api/paths/queries";

export function isUrl(s: string): boolean {
  try {
    const url = new URL(s);
    const res = url.protocol === "https:" || url.protocol === "http:";
    return res;
  } catch (_) {
    return false;
  }
};

export function parseTemplateName(s: string): { workspaceId: string; template: string } {
  const workspaceRegex = /[@\/]+/i;

  return {
    workspaceId: s.split(workspaceRegex)[1],
    template: s.split(workspaceRegex)[2]
  }
}

export function parseFilter(input: string): QueryFilter {
  const operations = ["=", "!=", ">", "<", ">=", "<=", "INCLUDES"];
  const regex = new RegExp("^([\\w.@]+)\\s(" + operations.join("|") + ")\\s'?(.*?)'?$");
  const parts = input.match(regex);

  if (!parts || !parts[1] || !parts[2] || !parts[3]) {
    const m = "There was an error matching a regular expression";
    console.error(m, { input, parts, regex });
    throw Error("Regular expression doesn't match");
  }

  const key = parts[1];
  const operation = parts[2];
  const value = parts[3];

  if (String(Number(value)) === value) {
    return { key, operation, value: Number(value), type: "number" };
  }

  if (value === "true" || value === "false") {
    return { key, operation, value: value === "true" ? true : false, type: "boolean" };
  }

  return { key, operation, value, type: "string" };
}
