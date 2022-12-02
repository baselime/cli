import { QueryFilter, QueryOperation } from "./services/api/paths/queries";

export function isUrl(s: string): boolean {
  try {
    const url = new URL(s);
    const res = url.protocol === "https:" || url.protocol === "http:";
    return res;
  } catch (_) {
    return false;
  }
};


