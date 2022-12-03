import Conf from "conf";
import chalk from "chalk";
import { BinaryLike, createHash, randomBytes } from "crypto";
import { postPayload } from "./post-payload";
import { getRawServiceId } from "./service-id";
import { getEnvironmentData } from "./environment";

const TELEMETRY_KEY_ENABLED = "telemetry.enabled";
const TELEMETRY_KEY_NOTIFY_DATE = "telemetry.notifiedAt";
const TELEMETRY_KEY_ID = `telemetry.anonymousId`;

interface EventContext {
  anonymousId: string;
  serviceId: string;
  sessionId: string;
};

const conf = initializeConf();
const serviceId = hash(getRawServiceId());
const anonymousId = getAnonymousId();

notify();

export function enable(): void {
  conf && conf.set(TELEMETRY_KEY_ENABLED, true);
}

export function disable(): void {
  conf && conf.set(TELEMETRY_KEY_ENABLED, false);
}

export function isEnabled(): boolean {
  if (!conf) {
    return false;
  }

  return conf.get(TELEMETRY_KEY_ENABLED, true) !== false;
}

export function trackCommand(command: string, properties: Record<string, any>): void {
  record(command, properties);
}

function initializeConf() {
  try {
    return new Conf({ projectName: "baselime" });
  } catch (_) {
    return null;
  }
}

function notify() {
  if (!conf || !isEnabled()) {
    return;
  }

  // Do not notify if user has been notified before.
  if (conf.get(TELEMETRY_KEY_NOTIFY_DATE) !== undefined) {
    return;
  }
  conf.set(TELEMETRY_KEY_NOTIFY_DATE, Date.now().toString());

  console.log(
    `${chalk.cyan.bold(
      "Attention"
    )}: Baselime now collects completely anonymous telemetry regarding usage. This is used to guide our roadmap.`
  );
  console.log(
    `You can learn more, including how to opt-out of this anonymous program, by heading over to:`
  );
  console.log("https://docs.baselime.io/cli/anonymous-telemetry");
  console.log();
  record("downloaded", {});
}

function record(command: string, properties: any): Promise<any> {
  if (!isEnabled()) {
    return Promise.resolve();
  }

  const sessionId = randomBytes(32).toString("hex");
  const context: EventContext = {
    anonymousId,
    serviceId: serviceId,
    sessionId,
  };

  return postPayload({
    context,
    environment: getEnvironmentData(),
    data: {
      source: "cli",
      command,
      properties,
      timestammp: + new Date(),
    },
  });
}

function getAnonymousId(): string {
  const val = conf && conf.get(TELEMETRY_KEY_ID);
  if (val) {
    return val as string;
  }

  const generated = randomBytes(32).toString("hex");
  conf && conf.set(TELEMETRY_KEY_ID, generated);
  return generated;
}

function hash(payload: BinaryLike): string {
  return createHash("sha256").update(payload).digest("hex");
}
