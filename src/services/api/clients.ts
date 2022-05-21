import axios from "axios";
import chalk from "chalk";
import { hideBin } from "yargs/helpers";
import spinner from "../../services/spinner/index";
require("dotenv").config();
const argv = hideBin(process.argv);

function getBaseUrl(): string {
  const { BASELIME_BASE_URL = "https://go.baselime.io/v1/" } = process.env;
  const index = argv.findIndex(val => val === "--endpoint");
  if (index > -1) {
    return argv[index + 1];
  }
  return BASELIME_BASE_URL;
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
    const message = response ? `${response.status || "Error"} - ${response.message}` : error.message
    console.log(`${chalk.red(chalk.bold(message))}`);
    throw error;
  },
);

publicClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
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
