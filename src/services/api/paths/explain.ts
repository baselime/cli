import {client} from "../clients";

async function explain(question: string): Promise<string> {
    const res = (await client.post("/explain/", {question}, { timeout: 30000 })).data;
    return res.answer;
}

export default {
    explain
}