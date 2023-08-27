import chalk from "chalk";
import { object, string, number, array, boolean, InferType, lazy, mixed } from "yup";
import { getFileList } from "../../../services/config";
import spinner from "../../../services/spinner/index";
import { readMetadata, readResourcesFromFiles, readMetaVariables, ResourceMap } from "../../../services/parser/parser";
import awsCronParser from "aws-cron-parser";
import ms from "ms";
import { alertThresholdRegex, calculationsRegex, extractCalculation, parseFilter, parseThreshold, queryFilterRegex } from "../../../regex";
import { mapValues } from "lodash";
import { stepTemplates, templateSchema } from "../../../controllers/templates";
import { getLogger, hasDuplicates } from "../../../utils";
import { getCalculationAlias } from "../../../builder";
import { readMetadataFile } from "../../templates/handlers/fsHelper";
import { WidgetType } from "../../../services/api/paths/dashbaords";
import { ChannelTypes } from "../../../services/api/paths/alerts";

const filterCombinations = ["AND", "OR"];
const channelTypes = Object.values(ChannelTypes) as ChannelTypes[];
const groupByTypes = ["string", "number", "boolean"];
const widgetTypes = Object.values(WidgetType) as WidgetType[];

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
      frequency: string().strict().optional(),
      window: string().strict().optional(),
    })
      .required()
      .noUnknown(true)
      .strict(),
    enabled: boolean().optional(),
    channels: array()
      .min(1)
      .of(
        object({
          type: string().oneOf(channelTypes).required(),
          targets: array().of(string().required()),
        })
          .required()
          .noUnknown(true)
          .strict(),
      )
      .required(),
  })
    .required()
    .noUnknown(true)
    .strict(),
})
  .noUnknown(true)
  .strict();

const dashboardSchema = object({
  type: string().equals(["dashboard"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().optional(),
    description: string().optional(),
    parameters: object({
      widgets: array()
        .min(0)
        .of(
          object({
            query: string().required(),
            type: string().oneOf(widgetTypes).required(),
            name: string().strict().optional(),
            description: string().strict().optional(),
          })
            .optional()
            .noUnknown(true)
            .strict(),
        ),
    })
      .optional()
      .noUnknown(true)
      .strict(),
  })
    .required()
    .noUnknown(true)
    .strict(),
})
  .noUnknown(true)
  .strict();

const querySchema = object({
  type: string().equals(["query"]),
  id: string().required().matches(idRegex),
  properties: object({
    name: string().optional(),
    description: string().optional(),
    parameters: object({
      datasets: array().min(1).of(string()).required().typeError("Must include at least 1 dataset"),
      calculations: array().of(string().matches(calculationsRegex).required()).optional().nullable(),
      filters: array().of(string().matches(queryFilterRegex).required()).optional(),
      filterCombination: string().oneOf(filterCombinations).optional().typeError("filterCombination must be set to AND or OR."),
      needle: object({
        value: string().required(),
        isRegex: boolean(),
        matchCase: boolean(),
      })
        .nullable()
        .optional()
        .default(undefined)
        .noUnknown(true)
        .strict(),
      groupBys: array()
        .of(
          object({
            type: string().oneOf(groupByTypes).min(1).required(),
            value: string().min(1).required(),
          })
            .noUnknown(true)
            .strict(),
        )
        .optional(),
      orderBy: object({
        value: string().min(1).required(),
        order: string().oneOf(["ASC", "DESC"]).optional(),
      })
        .nullable()
        .optional()
        .default(undefined)
        .noUnknown(true)
        .strict(),
      limit: number().min(1).optional(),
    })
      .noUnknown(true)
      .required()
      .strict(),
  })
    .noUnknown(true)
    .required()
    .strict(),
})
  .noUnknown(true)
  .strict();

export const variableSchema = lazy((obj) =>
  object(
    mapValues(obj, () => {
      return lazy((val) => {
        const type = typeof val;
        if (type === "number") return number();
        if (type === "boolean") return boolean();
        return string();
      });
    }),
  ),
).optional();

const metadataSchema = object({
  version: string().required(),
  service: string().required().matches(idRegex),
  description: string().optional(),
  provider: string().required().oneOf(["aws"]),
  variables: lazy((obj) => object(mapValues(obj, () => variableSchema))).optional(),
  infrastructure: object({
    stacks: array().of(string().required()).optional(),
  })
    .noUnknown(true)
    .optional()
    .strict(),
  templates: array().of(templateSchema).optional(),
})
  .noUnknown(true)
  .strict();

export type DeploymentQuery = InferType<typeof querySchema>;
export type DeploymentAlert = InferType<typeof alertSchema>;
export type DeploymentDashboard = InferType<typeof dashboardSchema>;
export type DeploymentService = InferType<typeof metadataSchema>;
export type DeploymentVariable = InferType<typeof variableSchema>;

export interface UserVariableInputs {
  [name: string]: string | number | boolean;
}

export interface DeploymentResources {
  queries: DeploymentQuery[];
  alerts: DeploymentAlert[];
  dashboards: DeploymentDashboard[];
}

async function readAndValidateLocalResources(
  folder: string,
  stage?: string,
  inputVariables?: UserVariableInputs,
  shouldDownloadTemplates: boolean = true,
): Promise<{ metadata: DeploymentService; resources: DeploymentResources; filenames: string[]; raw: string }> {
  const s = spinner.get();
  const { metadata, resourcesByKind, filenames, raw } = await readResources(folder, stage, inputVariables, shouldDownloadTemplates);
  await validateDeploymentResources(resourcesByKind);
  s.succeed(`Valid configuration folder ${folder}/`);
  return { metadata, resources: resourcesByKind, filenames, raw };
}

async function validateDeploymentResources(resourcesByKind: DeploymentResources): Promise<boolean> {
  const { queries, alerts, dashboards } = resourcesByKind;
  await Promise.all([...validateAlerts(alerts, queries), ...validateDashboards(dashboards, queries), ...validateQueries(queries)]);
  return true;
}

async function readResources(
  folder: string,
  stage?: string,
  inputVariables?: UserVariableInputs,
  shouldDownloadTemplates: boolean = true,
): Promise<{ metadata: DeploymentService; resourcesByKind: DeploymentResources; filenames: string[]; raw: string }> {
  const s = spinner.get();
  s.info(`Checking the configuration files in ${folder}`);
  let filenames = await getFileList(folder, [".yaml", ".yml"], [".templates"]);
  const metadata = await validateMetadata(folder, stage, inputVariables);

  const resourceFilenames = filenames.filter((a) => a !== `${folder}/index.yml` && !a.startsWith(`${folder}/.out`));
  const { resources, raw } = await readResourcesFromFiles(resourceFilenames, metadata.variables);
  if (!isObject(resources)) {
    const m = "Invalid file format - must be an object";
    const error = new Error(m);
    error.name = "Validation error";
    throw error;
  }

  if (metadata.templates) {
    await stepTemplates(folder, resources, metadata.templates, metadata.service, shouldDownloadTemplates);
  }

  const resourcesByKind = groupResourcesByKind(resources);
  return { metadata, resourcesByKind, filenames: resourceFilenames, raw };
}

function groupResourcesByKind(resources: ResourceMap) {
  const allResources = {
    queries: [] as any[],
    alerts: [] as any[],
    dashboards: [] as any[],
  };

  // group resources by type
  Object.keys(resources).forEach((id) => {
    const resourceDescriptor = resources[id];
    const resource = resourceDescriptor.resource;
    if (!isObject(resource)) {
      const m = `${id}: invalid object format`;
      const error = new Error(m);
      error.name = "Validation error";
      throw error;
    }
    switch (resource.type) {
      case "query":
        allResources.queries.push({ ...resource, id, type: undefined });
        break;
      case "alert":
        allResources.alerts.push({ ...resource, id, type: undefined });
        break;
      case "dashboard":
        allResources.dashboards.push({ ...resource, id, type: undefined });
        break;
      default:
        const m = `${id}: unknown resource type: ${resource.type} - ${JSON.stringify(resource)}`;
        const error = new Error(m);
        error.name = "Validation error";
        throw error;
    }
  });
  return allResources;
}

function isObject(val: any): boolean {
  return typeof val === "object" && !Array.isArray(val) && val !== null;
}

export async function validateMetadata(folder: string, stage?: string, inputVariables?: UserVariableInputs): Promise<DeploymentService> {
  const s = spinner.get();
  let rawMeta: string;
  try {
    rawMeta = await readMetadataFile(folder);
  } catch (err) {
    const m = `Please include a index.yml or index.yaml file in the config folder (${folder}). This file is necessary to define the service and its metadata.`;
    const error = new Error(m);
    error.name = "Validation error";
    throw error;
  }
  const variables = await validateMetadataVariables(rawMeta, stage, inputVariables);
  const metadata = await readMetadata(rawMeta, variables);
  try {
    const m = await metadataSchema.validate(metadata);
    m.variables = variables;
    getLogger().debug("metadata valid");
    return m;
  } catch (error) {
    s.fail(chalk.bold(chalk.redBright("Failed to validate the index.yml file")));
    const message = `error: ${error}`;
    console.log(message);
    throw new Error(message);
  }
}

async function validateMetadataVariables(rawMeta: string, stage?: string, inputVariables?: UserVariableInputs): Promise<{ [name: string]: DeploymentVariable } | undefined> {
  getLogger().debug("validating metadata variables");
  const s = spinner.get();
  if (stage && ["description", "value"].includes(stage)) {
    const m = `Please use another value for the stage. ${stage} is forbidden.`;
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const variables = await readMetaVariables(rawMeta);
  return validateEachVariable(variables, inputVariables);
}

async function validateEachVariable(variables: Record<string, any> | undefined, inputVariables?: UserVariableInputs, stage?: string) {
  getLogger().debug("validating each metadata variable");
  const s = spinner.get();
  if (variables && !isObject(variables)) {
    const m = "invalid metadata file format - variables must be an object";
    s.fail(chalk.bold(chalk.redBright(`Validation error - ${m}`)));
    throw new Error(m);
  }

  const variableNames = Object.keys(variables || {});
  if (!(variables && variableNames?.length)) return;

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

function validateQueries(queries: any[] = []) {
  const s = spinner.get();

  const promises = queries.map(async (item) => {
    try {
      const res = await querySchema.validate(item);
      const filters = res.properties.parameters.filters;
      const calculations = res.properties.parameters.calculations;
      const orderBy = res.properties.parameters.orderBy;

      filters?.forEach((filter) => {
        parseFilter(filter);
      });

      const calcs = calculations?.map((calculation) => {
        return extractCalculation(calculation);
      });

      if (calcs?.length && hasDuplicates(calcs?.filter((c) => c.alias).map((c) => c.alias))) {
        throw new Error("Aliases must me unique across all calculation / visualisation .");
      }

      if (orderBy?.value && !calcs?.some((c) => getCalculationAlias(c) === orderBy?.value)) {
        throw new Error("The orderBy must be present in the visualisations.");
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

function validateAlerts(alerts: any[] = [], queries: any[] = []) {
  const s = spinner.get();

  const promises = alerts.map(async (item) => {
    try {
      const alert = await alertSchema.validate(item);
      const threshold = alert.properties.parameters.threshold;
      parseThreshold(threshold);
      const query = queries.find((query) => query.id === alert.properties.parameters.query);
      if (!query) {
        throw new Error(`The following query was not found in this service: ${alert.properties.parameters.query}`);
      }

      const { frequency, window } = alert.properties.parameters;
      const convertedFrequency = ms(frequency as string);
      const convertedWindow = ms(window as string);
      if (!convertedFrequency && frequency) {
        try {
          awsCronParser.parse(frequency);
        } catch (error) {
          throw new Error("Invalid frequency expression. Please follow the AWS Cron specs.");
        }
      }

      if (convertedFrequency && convertedFrequency < 60000) {
        throw new Error("Invalid frequency. Minimum is 1min.");
      }

      if (!convertedWindow || convertedWindow < 60000) {
        // undefined or less than 1 minute
        throw new Error("Invalid window.");
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

function validateDashboards(dashboards: any[] = [], queries: any[] = []) {
  const s = spinner.get();

  const promises = dashboards.map(async (item) => {
    try {
      const res = await dashboardSchema.validate(item);

      res.properties.parameters?.widgets?.forEach((widget) => {
        if (!widget) return;
        const query = queries.find((query) => query.id === widget.query);
        if (!query) {
          throw new Error(`The following query was not found in this service: ${widget.query}`);
        }
      });
    } catch (error) {
      const message = `dashboard: ${item.id}: ${error}`;
      s.fail(chalk.bold(chalk.redBright("Dashboard validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

export default {
  readResources,
  readAndValidateLocalResources,
};
