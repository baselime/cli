import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import { OutputFormat } from "../../../shared";
import dayjs from "dayjs";
import chalk from "chalk";
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

async function list(format: OutputFormat, service?: string) {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = await api.queriesList(service);
  s.succeed();
  outputs.list(queries, format);
}

export default {
  list,
};
