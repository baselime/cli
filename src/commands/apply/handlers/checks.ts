import chalk from "chalk";
import yaml from "yaml";
import { object, string, number, array, boolean, mixed } from 'yup';
import spinner from "../../../services/spinner/index";

const operations = ["=", "!=", ">", ">=", "<", "<=", "INCLUDES"];
const filterCombinations = ["AND", "OR"];
const namespaceCombinations = ["INCLUDE", "EXCLUDE", "STARTS_WITH"];
const channelTypes = ["email"];

const queryFilterRegex = new RegExp("^([\\w.@]+)\\s:(" + operations.join("|") + ")\\s'?(.*?)'?$");
const alertThresholdRegex = new RegExp("^:(" + operations.filter(o => o != "INCLUDES").join("|") + ")\\s([0-9]*)$");

const alertSchema = object({
  name: string().notRequired(),
  description: string().notRequired(),
  parameters: object({
    query: string().required(),
    threshold: string().matches(alertThresholdRegex).required(),
    frequency: number().strict().required().min(1),
    duration: number().strict().required(),
  }).required(),
  enabled: boolean().notRequired(),
  channels: array().min(1).of(string().required()).required(),
});

const channelSchema = object({
  name: string().notRequired(),
  type: string().oneOf(channelTypes).required(),
  targets: array().of(string().email().required())
});

const queriesSchema = object({
  name: string().notRequired(),
  description: string().notRequired(),
  parameters: object({
    dataset: string().required(),
    namespaces: array().of(string()).notRequired(),
    calculations: array().of(string().matches(/(^[a-zA-Z0-9]*)\(([^\)]+)\)|(COUNT)/i)).required(),
    filters: array().of(string().matches(queryFilterRegex)).notRequired(),
    filterCombination: string().oneOf(filterCombinations).notRequired(),
    namespaceCombination: string().oneOf(namespaceCombinations).notRequired(),
  })
});

async function validate(file: string) {
  const s = spinner.get();
  s.start("Checking the configuration file...");

  let { queries, alerts, channels } = yaml.parse(file);
  queries ||= {};
  alerts ||= {};
  channels ||= {};

  if (!isObject(channels)) {
    throw new Error("invalid channels object format");
  }

  if (!isObject(queries)) {
    throw new Error("invalid queries object format");
  }

  if (!isObject(alerts)) {
    throw new Error("invalid alerts object format");
  }

  const alertsKeys = Object.keys(alerts);
  const channelsKeys = Object.keys(channels);
  const queriesKeys = Object.keys(queries);

  const alertsPromises = alertsKeys.map(async ref => {
    try {
      const alert = await alertSchema.validate(alerts[ref]);
      const query = queriesKeys.find(ref => ref === alert.parameters.query);
      const missingChannels = alert.channels.filter(ref => !channelsKeys.includes(ref))
      if (!query) {
        throw new Error(`the following query was not found in this application: ${alert.parameters.query}`);
      }
      if (missingChannels.length) {
        throw new Error(`the following channels were not found in this application: ${missingChannels.join(", ")}`);
      }
    } catch (error) {
      const message = `alert: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Alert validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  const queriesPromises = queriesKeys.map(async ref => {
    try {
      await queriesSchema.validate(queries[ref]);
    } catch (error) {
      const message = `query: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Query validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  const channelsPromises = channelsKeys.map(async ref => {
    try {
      await channelSchema.validate(channels[ref]);
    } catch (error) {
      const message = `channel: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Channel validation error")));
      console.log(message);
      throw new Error(message);
    }
  })

  await Promise.all([...alertsPromises, ...queriesPromises, ...channelsPromises]);
  s.succeed("Valid configuration file");
}

function isObject(val: any): boolean {
  return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

export default {
  validate,
}
