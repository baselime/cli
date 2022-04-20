import yaml from "yaml";
import { object, string, number, array, boolean, mixed } from 'yup';
import spinner from "../../services/spinner/index";

const operations = ["=", "!=", ">", ">=", "<", "<=", "INCLUDES"];
const alertDestinations = ["email"];
const filterCombinations = ["AND", "OR"];

const alertSchema = object({
  name: string().notRequired(),
  description: string().notRequired(),
  parameters: object({
    query: string().required(),
    threshold: object({
      operation: string().oneOf(operations).required(),
      value: number().required(),
    }).required(),
    frequency: number().strict().required().min(1),
    duration: number().strict().required(),
  }).required(),
  enabled: boolean().notRequired(),
  destinations: array().of(object({
    type: string().oneOf(alertDestinations).required(),
    target: string().required(),
  })).required(),
});

const queriesSchema = object({
  name: string().notRequired(),
  description: string().notRequired(),
  parameters: object({
    dataset: string().required(),
    namespaces: array().of(string()).notRequired(),
    calculations: array().of(string().matches(/(^[a-zA-Z0-9]*)\(([^\)]+)\)|(COUNT)/i)).notRequired(),
    filters: array().of(object({
      key: string().required(),
      operation: string().oneOf(operations).required(),
      value: mixed().required(),
    })),
    filterCombination: string().oneOf(filterCombinations).notRequired(),
  })
});

async function apply(file: string) {
  const s = spinner.get();
  s.start("Checking the configuration file...");
  const { queries, alerts } = yaml.parse(file);

  if (!isObject(queries)) {
    throw new Error("invalid queries object format");
  }


  if (!isObject(alerts)) {
    throw new Error("invalid alerts object format");
  }

  const alertsKeys = Object.keys(alerts);
  const queriesKeys = Object.keys(queries);

  const alertsPromises = alertsKeys.map(async ref => {
    try {
      const alert = await alertSchema.validate(alerts[ref]);
      const query = queriesKeys.find(ref => ref === alert.parameters.query);
      if (!query) {
        throw new Error(`the following query was not found in this application: ${alert.parameters.query}`);
      }
    } catch (error) {
      const message = `alert: ${ref}: ${error}`;
      s.fail(message);
      throw new Error(message);
    }
  });

  const queriesPromises = queriesKeys.map(async ref => {
    try {
      const query = await queriesSchema.validate(queries[ref]);
    } catch (error) {
      const message = `query: ${ref}: ${error}`;
      s.fail(message);
      throw new Error(message);
    }
  });

  await Promise.all([...alertsPromises, ...queriesPromises]);
  s.succeed("Valid configuration file");
}

function isObject(val: any): boolean {
  return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

export default {
  apply,
}
