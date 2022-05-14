import axios from "axios";
import chalk from "chalk";
import spinner from "../../services/spinner/index";
require("dotenv").config();

const { BASELIME_BASE_URL = "https://go.baselime.io/v1/" } = process.env;
const baseUrl = BASELIME_BASE_URL;

export const client = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicClient = axios.create({
  baseURL: baseUrl,
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
    const message = response ? `${response.status} - ${response.message}` : error.message
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
