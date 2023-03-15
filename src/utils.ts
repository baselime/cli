import { QueryFilter, QueryOperation } from "./services/api/paths/queries";
import crypto from "crypto";
import {log} from "util";

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

export function hasDuplicates<T>(array: T[]) {
  return new Set(array).size !== array.length;
}

class Logger {
  logLevel: number;
  constructor() {
    switch (process.env["LOG_LEVEL"]) {
      case "trace":
        this.logLevel = 4;
        break;
      case "debug":
        this.logLevel = 3;
        break;
      case "info":
        this.logLevel = 2;
        break;
      case "warn":
        this.logLevel = 1;
        break;
      case "error":
        this.logLevel = 0;
        break;
      default:
        this.logLevel = 2;
    }
  }

  trace(message?: any, ...optionalParams: any[]) {
    if (this.logLevel >= 4) {
      console.log(message, ...optionalParams);
    }
  }

  debug(message?: any, ...optionalParams: any[]) {
    if (this.logLevel >= 3) {
      console.log(message, ...optionalParams);
    }
  }

  info(message?: any, ...optionalParams: any[]) {
    if (this.logLevel >= 2) {
      console.log(message, ...optionalParams);
    }
  }

  warn(message?: any, ...optionalParams: any[]) {
    if (this.logLevel >= 1) {
      console.log(message, ...optionalParams);
    }
  }

  error(message?: any, ...optionalParams: any[]) {
    if (this.logLevel >= 0) {
      console.log(message, ...optionalParams);
    }
  }
}

let logger: Logger;

export function getLogger() {
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}