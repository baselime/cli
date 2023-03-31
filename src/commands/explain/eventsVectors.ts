import crypto from "crypto";

const dictionary: Record<string, any> = {};

export function processEvents(events: any[]): string[] {
    const messagesByHash: Record<string, string> = {};
    const tokensByHash: Record<string, string[]> = {};
    for (const event of events) {
        const index = event["string.names"].findIndex((name: string) => name === "error");
        const msg = event["string.values"][index];
        const hashId = crypto.createHash("sha1").update(msg).digest("base64");
        messagesByHash[hashId] = msg;
        tokensByHash[hashId] = processMessage(msg);
    }
    const hashesByVector: Map<string, string> = new Map();
    for (const hash of Object.keys(tokensByHash)) {
        const vectorAsString = produceVector(tokensByHash[hash]).join("");
        if(hashesByVector.get(vectorAsString)) {
            // omit identical
        } else {
            hashesByVector.set(vectorAsString, hash)
        }
    }
    const distinct: string[] = [];
    hashesByVector.forEach((hash) => {
        distinct.push(messagesByHash[hash]);
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
        dictionary[token] ? dictionary[token]++ : dictionary[token] = 1;
        validTokens.push(token);
    }
    return validTokens;
}

function produceVector(tokens: string[]): number[] {
    const vectorKeys = Object.keys(dictionary);
    const resultVector: number[] = Array(vectorKeys.length);
    for (const token of tokens) {
        const tokenIndex: number = vectorKeys.findIndex(key => key === token);
        if (tokenIndex < 0) {
            continue;
        }
        resultVector[tokenIndex] ?
            resultVector[tokenIndex]++ :
            resultVector[tokenIndex] = 1;
    }
    return Array.from(resultVector, item => item || 0)
}