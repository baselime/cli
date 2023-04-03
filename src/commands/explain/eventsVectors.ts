import crypto from "crypto";
import { Event } from "../../services/api/paths/events";

const dictionary: Record<string, any> = {};

type EventsData = {
  message: string;
  occurrences: number;
  lastOccurrence: Date;
  dataset: string;
  service: string;
  namespace: string;
};

export function processEvents(events: Event[]): EventsData[] {
  const messagesByHash: Record<string, string> = {};
  const tokensByHash: Record<string, string[]> = {};
  const eventsByHash: Record<string, Event> = {};
  for (const event of events) {
    const index = event["string.names"].findIndex((name: string) => {
      switch (name.toLowerCase()) {
        case "message":
        case "@message":
        case "msg":
        case "@message.message":
        case "@message.msg":
        case "error":
          return true;
      }
      return false;
    });
    const msg = event["string.values"][index];
    if (msg) {
      const hashId = crypto.createHash("sha1").update(msg).digest("base64");
      messagesByHash[hashId] = msg;
      tokensByHash[hashId] = processMessage(msg);
      eventsByHash[hashId] = event;
    }
  }
  const hashesByVector: Map<string, string[]> = new Map();
  for (const hash of Object.keys(tokensByHash)) {
    const vectorAsString = produceVector(tokensByHash[hash]).join("");
    const existing = hashesByVector.get(vectorAsString);
    if (existing) {
      existing.push(hash);
    } else {
      hashesByVector.set(vectorAsString, [hash]);
    }
  }
  // populate
  const distinct: EventsData[] = [];
  hashesByVector.forEach((hash, key) => {
    const firstHash = hash[0];
    const event = eventsByHash[firstHash];
    distinct.push({
      dataset: event._dataset,
      service: event._service,
      lastOccurrence: new Date(),
      message: messagesByHash[firstHash],
      namespace: event._namespace,
      occurrences: key.length,
    });
  });
  return distinct;
}

function processMessage(msg: string): string[] {
  const tokens = msg.split(" ");
  const validTokens = [];
  for (let token of tokens) {
    token = token.replace(",", "");
    if (/.{4,8}-.{4}-.{4}-.{4}-.{8,12}/.test(token)) {
      // ignore uuids
      continue;
    }
    dictionary[token] ? dictionary[token]++ : (dictionary[token] = 1);
    validTokens.push(token);
  }
  return validTokens;
}

function produceVector(tokens: string[]): number[] {
  const vectorKeys = Object.keys(dictionary);
  const resultVector: number[] = Array(vectorKeys.length);
  for (const token of tokens) {
    const tokenIndex: number = vectorKeys.findIndex((key) => key === token);
    if (tokenIndex < 0) {
      continue;
    }
    resultVector[tokenIndex] ? resultVector[tokenIndex]++ : (resultVector[tokenIndex] = 1);
  }
  return Array.from(resultVector, (item) => item || 0);
}
