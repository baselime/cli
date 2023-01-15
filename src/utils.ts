import { QueryFilter, QueryOperation } from "./services/api/paths/queries";
import crypto from "crypto";

export function isUrl(s: string): boolean {
  try {
    const url = new URL(s);
    const res = url.protocol === "https:" || url.protocol === "http:";
    return res;
  } catch (_) {
    return false;
  }
}

export function randomString(size: number) {
  return crypto.randomBytes(size).toString("base64").slice(0, size);
}
