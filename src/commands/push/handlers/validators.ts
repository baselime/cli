import chalk from "chalk";
import { object, string, number, array, boolean, InferType, lazy, mixed } from 'yup';
import { getFileList } from "../../../services/config";
import spinner from "../../../services/spinner/index";
import { readMetadata, readResources, readVariables } from "../../../services/parser/parser";
import awsCronParser from "aws-cron-parser";
import ms from "ms";
import { alertThresholdRegex, calculationsRegex, extractCalculation, parseFilter, parseThreshold, queryFilterRegex } from "../../../regex";
import { mapValues } from "lodash";
import { downloadAndSaveTemplates } from "../../../controllers/templates";
import templates from "../../../services/api/paths/templates";


const filterCombinations = ["AND", "OR"];
const namespaceCombinations = ["INCLUDE", "EXCLUDE", "STARTS_WITH"];
const channelTypes = ["slack", "webhook"];
const groupByTypes = ["string", "number", "boolean"];

const idRegex = /^[a-zA-Z0-9-_]+$/;

const alertSchema = object({
  type: string().equals(["alert"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().optional(),
    description: string().optional(),
    parameters: object({
      query: string().required(),
      threshold: string().matches(alertThresholdRegex).required(),
      frequency: string().strict().required(),
      window: string().strict().required(),
    })
      .required()
      .noUnknown(true)
      .strict(),
    enabled: boolean().optional(),
    channels: array().min(1).of(object({
      type: string().oneOf(channelTypes).required(),
      targets: array().of(string().required()),
    })
      .required()
      .noUnknown(true)
      .strict()).required(),
  })
    .required()
    .noUnknown(true)
    .strict(),
})
  .noUnknown(true)
  .strict();

const webhookSchema = object({
  webhook: string().url().required().typeError('Webhook must be valid URL')
});

const querySchema = object({
  type: string().equals(["query"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().optional(),
    description: string().optional(),
    parameters: object({
      datasets: array()
        .min(1)
        .of(string())
        .required()
        .typeError("Must include at least 1 dataset"),
      namespaces: array().of(string()).optional(),
      calculations: array()
        .of(string().matches(calculationsRegex).required())
        .optional().nullable(),
      filters: array().of(string().matches(queryFilterRegex).required()).optional(),
      filterCombination: string().oneOf(filterCombinations).optional().typeError('filterCombination must be set to AND or OR.'),
      namespaceCombination: string().oneOf(namespaceCombinations).optional().typeError('namespaceCombination must be set to INCLUDE, EXCLUDE or STARTS_WITH.'),
      needle: object({
        value: string().required(),
        isRegex: boolean(),
        matchCase: boolean(),
      }).nullable().optional().default(undefined).noUnknown(true).strict(),
      groupBy: object({
        type: string().oneOf(groupByTypes).min(1).required(),
        value: string().min(1).required(),
        orderBy: string().min(1).matches(calculationsRegex).optional(),
        limit: number().min(1).optional(),
        order: string().oneOf(["ASC", "DESC"]).optional(),
      }).nullable().optional().default(undefined).noUnknown(true).strict(),
    }).noUnknown(true).required().strict(),
  }).noUnknown(true).required().strict(),
}).noUnknown(true).strict();

const variableSchema = lazy(obj => object(
  mapValues(obj, () => {
    return lazy(val => {
      const type = typeof val;
      if (type === "number") return number();
      if (type === "boolean") return boolean();
      return string();
    })
  })
)).optional();


const metadataSchema = object({
  version: string().required(),
  service: string().required().matches(idRegex),
  description: string().optional(),
  provider: string().required().oneOf(["aws"]),
  variables: lazy(obj => object(
    mapValues(obj, () => variableSchema)
  )).optional(),
  infrastructure: object({
    stacks: array().of(string().required()).optional(),
  }).noUnknown(true).optional().strict(),
  templates: array().of(string().required()).optional(),
}).noUnknown(true).strict();

export type DeploymentQuery = InferType<typeof querySchema>;
export type DeploymentAlert = InferType<typeof alertSchema>;
export type DeploymentService = InferType<typeof metadataSchema>;
export type DeploymentVariable = InferType<typeof variableSchema>;

export interface UserVariableInputs {
  [name: string]: string | number | boolean;
}

export interface DeploymentResources {
  queries?: DeploymentQuery[];
  alerts?: DeploymentAlert[];
}

async function validate(folder: string, stage?: string, inputVariables?: UserVariableInputs): Promise<{ metadata: DeploymentService, resources: DeploymentResources, filenames: string[], template: string }> {
  const s = spinner.get();
  s.start("Checking the configuration files...");
  const filenames = await getFileList(folder, [".yaml", ".yml"]);

  if (!filenames.includes(`${folder}/index.yml`)) {
    const m = "Please include a index.yml file in the config folder. This file is necessary to define the service and its metadata.";
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const metadata = await validateMetadata(folder, stage, inputVariables);

  if(metadata.templates) {
    s.info("Downloading templates");
    const paths = await downloadAndSaveTemplates(folder, metadata.templates as string[], metadata.service);
    filenames.concat(...paths);
  }

  const resourceFilenames = filenames.filter(a => a !== `${folder}/index.yml` && !a.startsWith(`${folder}/.out`));

  const { resources, template } = (await readResources(resourceFilenames, metadata.variables)) || {};
  if (!isObject(resources)) {
    const m = `invalid file format - must be an object`;
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const allResources = {
    queries: [] as any[],
    alerts: [] as any[],
  }


  Object.keys(resources).forEach(id => {
    const resource = resources[id];
    if (!isObject(resource)) {
      const m = `${id}: invalid object format`;
      s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
      throw new Error(m);
    }
    const { type } = resource;
    switch (type) {
      case "query":
        allResources.queries.push({ ...resource, id, type: undefined });
        break;
      case "alert":
        allResources.alerts.push({ ...resource, id, type: undefined });
        break;
      default:
        const m = `${id}: unknown resource type, ${type}`;
        s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
        throw new Error(m);
    }
  });

  const { queries, alerts } = allResources;

  await Promise.all([
    ...validateAlerts(alerts, queries),
    ...validateQueries(queries),
  ]);

  s.succeed("Valid configuration folder");
  return { metadata, resources: allResources, filenames: resourceFilenames, template };
}

function isObject(val: any): boolean {
  return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

export async function validateMetadata(folder: string, stage?: string, inputVariables?: UserVariableInputs): Promise<DeploymentService> {
  const s = spinner.get();
  const variables = await validateVariables(folder, stage, inputVariables);
  const metadata = await readMetadata(folder, variables);
  try {
    const m = await metadataSchema.validate(metadata);
    m.variables = variables;
    return m;
  } catch (error) {
    s.fail(chalk.bold(chalk.redBright("Failed to validate the index.yml file")));
    const message = `error: ${error}`;
    console.log(message);
    throw new Error(message);
  }
}

async function validateVariables(folder: string, stage?: string, inputVariables?: UserVariableInputs): Promise<{ [name: string]: DeploymentVariable } | undefined> {
  const s = spinner.get();

  if (stage && ["description", "value"].includes(stage)) {
    const m = `Please use another value for the stage. ${stage} is forbidden.`;
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const variables = await readVariables(folder);
  if (!isObject(variables)) {
    const m = `invalid file format - must be an object`;
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const variableNames = Object.keys(variables || {});
  if (!variables || !variableNames?.length) return;

  for (let index = 0; index < variableNames.length; index += 1) {
    const variableName = variableNames[index];

    try {
      await variableSchema.validate(variables[variableName]);
    } catch (error) {
      s.fail(chalk.bold(chalk.redBright("Failed to validate the variables in the index.yml file")));
      const message = `error: ${variableName} - ${error}`;
      console.log(message);
      throw new Error(message);
    }

    variables[variableName] = variables[variableName] || {};
    if (inputVariables) {
      variables[variableName]!.value = inputVariables[variableName];
    }
    if (stage) {
      variables[variableName]!.value = variables[variableName][stage];
    }
    if (typeof variables[variableName]?.default === "undefined" && typeof variables[variableName]?.value === "undefined") {
      throw new Error(`Variable ${variableName} must have at least one of value or default`);
    }
  }

  return variables;
}

function validateQueries(queries: any[]) {
  const s = spinner.get();

  const promises = queries.map(async item => {
    try {
      const res = await querySchema.validate(item);
      const filters = res.properties.parameters.filters;
      const calculations = res.properties.parameters.calculations;
      const groupBy = res.properties.parameters.groupBy;

      filters?.forEach(filter => {
        parseFilter(filter);
      });

      calculations?.forEach(calculation => {
        extractCalculation(calculation);
      });

      if (groupBy?.orderBy && !calculations?.includes(groupBy?.orderBy)) {
        throw new Error("The orderBy field of the groupBy must be present in the calculations.");
      }
    } catch (error) {
      const message = `query: ${item.id}: ${error}`;
      s.fail(chalk.bold(chalk.redBright("Query validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateAlerts(alerts: any[], queries: any[]) {
  const s = spinner.get();

  const promises = alerts.map(async item => {
    try {
      const alert = await alertSchema.validate(item);
      const threshold = alert.properties.parameters.threshold;
      parseThreshold(threshold);
      const query = queries.find(query => query.id === alert.properties.parameters.query);
      if (!query) {
        throw new Error(`The following query was not found in this service: ${alert.properties.parameters.query}`);
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

      if (!convertedWindow) {
        try {
          awsCronParser.parse(frequency);
        } catch (error) {
          throw new Error(`Invalid window expression. Please follow the AWS Cron specs.`);
        }
      }

      if (!convertedFrequency || convertedFrequency < 60000) {
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
