export interface BaseOptions {
  profile?: string;
  quiet?: boolean;
  "api-key"?: string;
  json?: boolean;
}

export const baseOptions = {
  profile: { type: "string", default: "default" },
  "api-key": { type: "string" },
  quiet: { type: "boolean", default: false, alias: "q" },
  json: { type: "boolean", default: false, conflicts: "output" },
} as const;
