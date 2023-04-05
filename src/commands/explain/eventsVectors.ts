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

type AnotherFoo = {
  vector: number[];
  similarHashes: string[];
};

export function processEvents(events: Event[]): EventsData[] {
  // const messagesByHash: Record<string, string> = {};
  const tokensByHash: Record<string, string[]> = {};
  type Foo = {
    event: Event;
    tokens: string[];
  }
  const foosByHash: Record<string, Foo> = {};
  const tokensDictionary: Record<string, number> = {};
  for (const event of events) {
    if (!event["string.values"]) {
      continue;
    }
    const combinedMessage = event["string.values"].join(" ");
    // const index = event["string.names"].findIndex((name: string) => {
    //   switch (name.toLowerCase()) {
    //     case "message":
    //     case "@message":
    //     case "msg":
    //     case "@message.message":
    //     case "@message.msg":
    //     case "error":
    //       return true;
    //   }
    //   return false;
    // });
    // const msg = event["string.values"][index];
    if (combinedMessage) {
      const hashId = crypto.createHash("sha1").update(combinedMessage).digest("base64");
      // messagesByHash[hashId] = combinedMessage;
      // tokensByHash[hashId] = prepareMessage(combinedMessage);
      const tokens = prepareMessage(combinedMessage);
      addTokensToDictionary(tokensDictionary, tokens);
      foosByHash[hashId] = {
        event,
        tokens
      };
    }
  }

  // console.log(tokensDictionary)

  const vectorsByHash: Record<string, AnotherFoo> = {};
  for (const hash in foosByHash) {
    const value = foosByHash[hash];
    const vector = produceVector(value.tokens);
    const foundSimilar = findExistingSimilarities(vectorsByHash, vector, hash);
    if (!foundSimilar) {
      vectorsByHash[hash] = {
        vector,
        similarHashes: []
      };
    }
    // console.log('foo', value.tokens)
  }
  console.log('vectorsByHash', JSON.stringify(vectorsByHash))
  // console.log('???', vectorsByHash)
  // group errors


  // vector processing
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
    const event = foosByHash[firstHash];
    // distinct.push({
    //   dataset: event._dataset,
    //   service: event._service,
    //   lastOccurrence: new Date(),
    //   message: messagesByHash[firstHash],
    //   namespace: event._namespace,
    //   occurrences: key.length,
    // });
  });
  return distinct;
}

function findExistingSimilarities(vectorsByHash: Record<string, AnotherFoo>, vector: number[], thatHash: string): boolean {
  for (const otherHash in vectorsByHash) {
    const cosine = compareVectors(vectorsByHash[otherHash].vector, vector);
    if (cosine > 0.6) {
      vectorsByHash[otherHash].similarHashes ?
          vectorsByHash[otherHash].similarHashes.push(thatHash) :
          vectorsByHash[otherHash].similarHashes = [thatHash]
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
