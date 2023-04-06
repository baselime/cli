import crypto from "crypto";
import { Event } from "../../services/api/paths/events";

const dictionary: Record<string, any> = {};

export type EventsData = {
  event: Event;
  summary: string;
  occurrences: number;
  lastOccurrence: Date;
  combinedMessage: string;
};

type EventGroup = {
  vector: number[];
  hash: string;
  similarHashes: string[];
};

type AdditionalData = {
  event: Event;
  tokens: string[];
  summary: string;
  combinedMessage: string;
}

export function processEvents(events: Event[]): EventsData[] {
  // build dictionary
  const additionalData: Record<string, AdditionalData> = {};
  const tokensDictionary: Record<string, number> = {};
  for (const event of events) {
    if (!event["string.values"]) {
      continue;
    }
    // find most useful
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
    const summary = event["string.values"][index];


    const combinedMessage = event["string.values"].join(" ");
    if (combinedMessage) {
      const hashId = crypto.createHash("sha1").update(combinedMessage).digest("base64");
      const tokens = prepareMessage(combinedMessage);
      addTokensToDictionary(tokensDictionary, tokens);
      additionalData[hashId] = {
        event,
        tokens,
        summary,
        combinedMessage
      };
    }
  }

  const eventGroups: EventGroup[] = [];
  for (const hash in additionalData) {
    const value = additionalData[hash];
    const vector = produceVector(value.tokens);
    const foundSimilar = findExistingSimilarities(eventGroups, vector, hash);
    if (!foundSimilar) {
      eventGroups.push({
        vector,
        hash,
        similarHashes: []
      });
    }
  }

  // vector processing
  const distinct: EventsData[] = [];
  eventGroups.forEach((eventGroup) => {
    const {event, summary, combinedMessage} = additionalData[eventGroup.hash];
    distinct.push({
      event: event,
      // dataset: event._dataset,
      // service: event._service,
      lastOccurrence: findLastOccurrence(eventGroup, additionalData),
      summary: summary,
      // namespace: event._namespace,
      occurrences: eventGroup.similarHashes.length +  1,
      combinedMessage
    });
  });
  return distinct;
}

function findLastOccurrence(group: EventGroup, additionalData: Record<string, AdditionalData>): Date {
  let latest = new Date(additionalData[group.hash].event._timestamp);
  group.similarHashes.forEach(hash => {
    let alt = new Date(additionalData[hash].event._timestamp)
    if (alt.valueOf() > latest.valueOf()) {
      latest = alt;
    }
  })
  return latest;
}

function findExistingSimilarities(groups: EventGroup[], vector: number[], hash: string): boolean {
  for (const index in groups) {
    const cosine = compareVectors(groups[index].vector, vector);
    if (cosine > 0.6) {
      groups[index].similarHashes ?
          groups[index].similarHashes.push(hash) :
          groups[index].similarHashes = [hash]
      return true
    }
  }
  return false
}

function compareVectors(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length != vectorB.length) {
    console.log('incorrect vector!')
    return 0;
  }
  let dotProduct = 0;
  let sumASqr = 0;
  let sumBSqr = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += (vectorA[i] * vectorB[i]);
    sumASqr += Math.pow(vectorA[i], 2);
    sumBSqr += Math.pow(vectorB[i], 2);
  }
  //cosine
  return dotProduct / (Math.sqrt(sumASqr) * Math.sqrt(sumBSqr))
}

function addTokensToDictionary(dict: Record<string, number>, tokens: string[]) {
  for (const token of tokens) {
    dict[token] ? dict[token]++ : dict[token] = 1;
  }
}

function prepareMessage(msg: string): string[] {
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
