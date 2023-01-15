import axios from "axios";
require("dotenv").config();

export async function postPayload(payload: Record<string, any>) {
  try {
    const { BASELIME_DOMAIN = "baselime.io" } = process.env;
    const endpoint = `https://telemetry.${BASELIME_DOMAIN}/v1/cli`;
    await axios.post(endpoint, [payload]);
  } catch (_) {}
}
