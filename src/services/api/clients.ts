import axios from "axios";
import chalk from "chalk";
import { hideBin } from "yargs/helpers";
import spinner from "../../services/spinner/index";
require("dotenv").config();
import http from "http";
const argv = hideBin(process.argv);

function getBaseUrl(): string {
  const { BASELIME_DOMAIN = "baselime.io" } = process.env;
  const index = argv.findIndex((val) => val === "--endpoint");
  if (index > -1) {
    const endpoint = argv[index + 1];
    return endpoint;
  }
  return `https://go.${BASELIME_DOMAIN}/v1/`;
}

export function getTuxUrl(): string {
  const { BASELIME_DOMAIN = "baselime.io" } = process.env;
  const index = argv.findIndex((val) => val === "--endpoint");
  if (index > -1) {
    const endpoint = argv[index + 1];
    return endpoint;
  }
  return `https://tux.${BASELIME_DOMAIN}`;
}

export function getDataUrl(): string {
  const { BASELIME_DOMAIN = "baselime.io" } = process.env;
  const index = argv.findIndex((val) => val === "--endpoint");
  if (index > -1) {
    const endpoint = argv[index + 1];
    return endpoint;
  }
  return `https://data.${BASELIME_DOMAIN}`;
}

export const client = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const s = spinner.get();
    s.fail();
    const response = error.response?.data;
    const message = response ? `${response.status || "Error"} - ${response.message}` : error.message;
    console.log(`${chalk.red(chalk.bold(message))}`);
    throw error;
  },
);

publicClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if ((error.request as http.ClientRequest).path.includes("/auth/api-key")) return;
    const s = spinner.get();
    s.fail();
    console.log(`${chalk.red(chalk.bold(error))}`);
    throw error;
  },
);

export function setAxiosAuth(apiKey: string) {
  client.interceptors.request.use(function (config) {
    if (!apiKey) {
      throw Error(`Unable to locate credentials. You can configure credentials by running "baselime auth"`);
    }
    if (!config.headers) return config;
    config.headers["x-api-key"] = apiKey || "";
    return config;
  });
}
