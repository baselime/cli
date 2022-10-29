import chalk from "chalk";
import { object, string, number, array, boolean, InferType, lazy } from 'yup';
import { getFileList } from "../../../services/config";
import spinner from "../../../services/spinner/index";
import { getMetadata, getResources } from "../../../services/parser/parser";
import awsCronParser from "aws-cron-parser";
import ms from "ms";

const operations = ["=", "!=", ">", ">=", "<", "<=", "INCLUDES", "IN", "NOT_IN"];
const filterCombinations = ["AND", "OR"];
const namespaceCombinations = ["INCLUDE", "EXCLUDE", "STARTS_WITH"];
const channelTypes = ["email", "slack", "webhook"];
const groupByTypes = ["string", "number", "boolean"];

const queryFilterRegex = new RegExp("^([\\w.@]+)\\s(" + operations.join("|") + ")\\s'?(.*?)'?$");
const alertThresholdRegex = new RegExp("^(" + operations.filter(o => !["INCLUDES", "IN", "NOT_IN"].includes(o)).join("|") + ")\\s([0-9]*)$");
const idRegex = /^[a-zA-Z0-9-_]+$/;

const alertSchema = object({
  type: string().equals(["alert"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().notRequired(),
    description: string().notRequired(),
    parameters: object({
      query: string().required(),
      threshold: string().matches(alertThresholdRegex).required(),
      frequency: string().strict().required(),
      window: string().strict().required(),
    }).required().noUnknown(true).strict(),
    enabled: boolean().notRequired(),
    channels: array().min(1).of(string().required()).required(),
  }).required().noUnknown(true).strict(),
}).noUnknown(true).strict();

const channelSchema = object({
  type: string().equals(["channel"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().notRequired(),
    type: string().oneOf(channelTypes).required(),
    targets: array().of(string().required())
  }).required().noUnknown(true).strict(),
}).noUnknown(true).strict();

const webhookSchema = object({
  webhook: string().url().required().typeError('Webhook must be valid URL')
});

const emailSchema = object({
  email: string().email().required()
});

const querySchema = object({
  type: string().equals(["query"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().notRequired(),
    description: string().notRequired(),
    parameters: object({
      dataset: string().required().typeError('Dataset must be set to an existing dataset, i.e logs.'),
      namespaces: array().of(string()).notRequired(),
      calculations: array().min(1).of(string().matches(/(^[a-zA-Z0-9]*)\(([^\)]+)\)|(COUNT)/)).required().typeError('Must include at least 1 valid calculation.'),
      filters: array().of(string().matches(queryFilterRegex)).notRequired(),
      filterCombination: string().oneOf(filterCombinations).notRequired().typeError('filterCombination must be set to AND or OR.'),
      namespaceCombination: string().oneOf(namespaceCombinations).notRequired().typeError('namespaceCombination must be set to INCLUDE, EXCLUDE or STARTS_WITH.'),
      groupBy: object({
        type: string().oneOf(groupByTypes).min(1).required(),
        value: string().min(1).required(),
        orderBy: string().min(1).notRequired(),
        limit: number().min(1).notRequired(),
        order: string().oneOf(["ACS", "DESC"]).notRequired(),
      }).nullable().notRequired().default(undefined).noUnknown(true).strict(),
    }).noUnknown(true).required().strict(),
  }).noUnknown(true).required().strict(),
}).noUnknown(true).strict();

const metadataSchema = object({
  version: string().required(),
  application: string().required().matches(idRegex),
  description: string().notRequired(),
  provider: string().required().oneOf(["aws"]),
  infrastructure: object({
    stacks: array().of(string()).notRequired().nullable(),
  }).noUnknown(true).notRequired().strict(),
}).noUnknown(true).strict();

export type DeploymentQuery = InferType<typeof querySchema>;
export type DeploymentAlert = InferType<typeof alertSchema>;
export type DeploymentChannel = InferType<typeof channelSchema>;
export type DeploymentApplication = InferType<typeof metadataSchema>;
export interface DeploymentResources {
  queries?: DeploymentQuery[];
  alerts?: DeploymentAlert[];
  channels?: DeploymentChannel[];
}



async function validate(folder: string): Promise<{ metadata: DeploymentApplication, resources: DeploymentResources, filenames: string[] }> {
  const s = spinner.get();
  s.start("Checking the configuration files...");
  const filenames = await getFileList(folder, [".yaml", ".yml"]);

  if (!filenames.includes(`${folder}/index.yml`)) {
    const m = "Please include a index.yml file in the config folder. This file is necessary to define the application and its metadata.";
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const metadata = await getMetadata(folder);
  try {
    const m = await metadataSchema.validate(metadata);
  } catch (error) {
    s.fail(chalk.bold(chalk.redBright("Failed to validate the index.yml file")));
    const message = `error: ${error}`;
    console.log(message);
    throw new Error(message);
  }

  const resourceFilenames = filenames.filter(a => a !== `${folder}/index.yml` && !a.startsWith(`${folder}/.out`));

  const data = (await getResources(resourceFilenames)) || {};
  if (!isObject(data)) {
    const m = `invalid file format - must be an object`;
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const resources = {
    queries: [] as any[],
    alerts: [] as any[],
    channels: [] as any[],
  }

  Object.keys(data).forEach(id => {
    const resource = data[id];
    if (!isObject(resource)) {
      const m = `${id}: invalid object format`;
      s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
      throw new Error(m);
    }
    const { type } = resource;
    switch (type) {
      case "query":
        resources.queries.push({ ...resource, id, type: undefined });
        break;
      case "alert":
        resources.alerts.push({ ...resource, id, type: undefined });
        break;
      case "channel":
        resources.channels.push({ ...resource, id, type: undefined });
        break;
      default:
        const m = `${id}: unknown resource type, ${type}`;
        s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
        throw new Error(m);
    }
  });

  const { queries, alerts, channels } = resources;

  await Promise.all([
    ...validateAlerts(alerts, queries, channels),
    ...validateQueries(queries),
    ...validateChannels(channels),
  ]);

  s.succeed("Valid configuration folder");
  return { metadata, resources, filenames: resourceFilenames };
}

function isObject(val: any): boolean {
  return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

function validateChannels(channels: any) {
  const s = spinner.get();
  const channelsKeys = Object.keys(channels);

  const promises = channelsKeys.map(async id => {
    try {
      const channel = channels[id];
      await channelSchema.validate(channel);


      if (channel.properties.type === 'webhook') {
        const promises = channel.properties.targets.map((webhook: string) => webhookSchema.validate({ webhook }))
        await Promise.all(promises)
      }

      if (channel.properties.type === 'email') {
        const promises = channel.properties.targets.map((email: string) => emailSchema.validate({ email }))
        await Promise.all(promises)
      }

    } catch (error) {
      const message = `channel: ${id}: ${error}`;
      s.fail(chalk.bold(chalk.redBright("Channel validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateQueries(queries: any[]) {
  const s = spinner.get();

  const promises = queries.map(async item => {
    try {
      await querySchema.validate(item);
    } catch (error) {
      const message = `query: ${item.id}: ${error}`;
      s.fail(chalk.bold(chalk.redBright("Query validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateAlerts(alerts: any[], queries: any[], channels: any[]) {
  const s = spinner.get();

  const promises = alerts.map(async item => {
    try {
      const alert = await alertSchema.validate(item);
      const query = queries.find(query => query.id === alert.properties.parameters.query);
      const missingChannels = alert.properties.channels.filter(id => !channels.some(c => c.id === id))
      if (!query) {
        throw new Error(`the following query was not found in this application: ${alert.properties.parameters.query}`);
      }
      if (missingChannels.length) {
        throw new Error(`the following channels were not found in this application: ${missingChannels.join(", ")}`);
      }

      const { frequency, window } = alert.properties.parameters;
      const convertedFrequency = ms(frequency as string);
      const convertedWindow = ms(window as string);
      if (!convertedFrequency) {
        try {
          awsCronParser.parse(frequency);
        } catch (error) {
          throw new Error(`Invalid frequency expression. Please follow the AWS Cron specs.`);
        }
      }

      if (convertedFrequency < 60000) {
        throw new Error(`Invalid frequency. Minimum is 1min.`);
      }

      if (!convertedWindow || convertedWindow < 60000) { // undefined or less than 1 minute
        throw new Error(`Invalid window.`);
      }

    } catch (error) {
      const message = `alert: ${item.id}: ${error}`;
      s.fail(chalk.bold(chalk.redBright("Alert validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}


export default {
  validate,
}
