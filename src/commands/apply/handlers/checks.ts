import chalk from "chalk";
import yaml from "yaml";
import { object, string, number, array, boolean, mixed } from 'yup';
import spinner from "../../../services/spinner/index";

const operations = ["=", "!=", ">", ">=", "<", "<=", "INCLUDES"];
const filterCombinations = ["AND", "OR"];
const namespaceCombinations = ["INCLUDE", "EXCLUDE", "STARTS_WITH"];
const channelTypes = ["email"];
const chartTypes = ["stats", "timeseries", "bar"];
const groupByTypes = ["string", "number", "boolean"];

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
    calculations: array().min(1).of(string().matches(/(^[a-zA-Z0-9]*)\(([^\)]+)\)|(COUNT)/i)).required(),
    filters: array().of(string().matches(queryFilterRegex)).notRequired(),
    filterCombination: string().oneOf(filterCombinations).notRequired(),
    namespaceCombination: string().oneOf(namespaceCombinations).notRequired(),
    groupBy: object({
      type: string().oneOf(groupByTypes).min(1).required(),
      value: string().min(1).required(),
    }).nullable().notRequired().default(undefined),
  })
});

const dashboardSchema = object({
  name: string().notRequired(),
  description: string().notRequired(),
  charts: array().min(1).of(string().required()).required(),
});

const chartSchema = object({
  name: string().notRequired(),
  type: string().oneOf(chartTypes).required(),
  parameters: object({
    query: string().required(),
    duration: number().strict().required(),
    xaxis: string().notRequired(),
    yaxis: string().notRequired(),
  }).required(),
});

async function validate(file: string) {
  const s = spinner.get();
  s.start("Checking the configuration file...");

  let { queries, alerts, channels, charts, dashboards } = yaml.parse(file);
  queries ||= {};
  alerts ||= {};
  channels ||= {};
  charts ||= {};
  dashboards ||= {};

  if (!isObject(channels)) {
    throw new Error("invalid channels object format");
  }

  if (!isObject(queries)) {
    throw new Error("invalid queries object format");
  }

  if (!isObject(alerts)) {
    throw new Error("invalid alerts object format");
  }

  if (!isObject(charts)) {
    throw new Error("invalid charts object format");
  }

  if (!isObject(dashboards)) {
    throw new Error("invalid dashboards object format");
  }

  await Promise.all([
    ...validateAlerts(alerts, queries, channels),
    ...validateQueries(queries),
    ...validateChannels(channels),
    ...validateCharts(charts, queries),
    ...validateDashboards(dashboards, charts),
  ]);
  s.succeed("Valid configuration file");
}

function isObject(val: any): boolean {
  return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

function validateChannels(channels: any) {
  const s = spinner.get();
  const channelsKeys = Object.keys(channels);

  const promises = channelsKeys.map(async ref => {
    try {
      await channelSchema.validate(channels[ref]);
    } catch (error) {
      const message = `channel: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Channel validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateQueries(queries: any) {
  const s = spinner.get();
  const queriesKeys = Object.keys(queries);

  const promises = queriesKeys.map(async ref => {
    try {
      await queriesSchema.validate(queries[ref]);
    } catch (error) {
      const message = `query: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Query validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateAlerts(alerts: any, queries: any, channels: any) {
  const s = spinner.get();
  const alertsKeys = Object.keys(alerts);
  const channelsKeys = Object.keys(channels);
  const queriesKeys = Object.keys(queries);

  const promises = alertsKeys.map(async ref => {
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

  return promises;
}

function validateCharts(charts: any, queries: any) {
  const s = spinner.get();
  const chartsKeys = Object.keys(charts);
  const queriesKeys = Object.keys(queries);

  const promises = chartsKeys.map(async ref => {
    try {
      const chart = await chartSchema.validate(charts[ref]);
      const query = queriesKeys.find(ref => ref === chart.parameters.query);
      if (!query) {
        throw new Error(`the following query was not found in this application: ${chart.parameters.query}`);
      }
    } catch (error) {
      const message = `chart: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Chart validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

function validateDashboards(dashboards: any, charts: any) {
  const s = spinner.get();
  const dashboardsKeys = Object.keys(dashboards);
  const chartsKeys = Object.keys(charts);

  const promises = dashboardsKeys.map(async ref => {
    try {
      const dashboard = await dashboardSchema.validate(dashboards[ref]);
      const missingCharts = dashboard.charts.filter(ref => !chartsKeys.includes(ref))
      if (missingCharts.length) {
        throw new Error(`the following charts were not found in this application: ${missingCharts.join(", ")}`);
      }
    } catch (error) {
      const message = `dashboard: ${ref}: ${error}`;
      s.fail(chalk.bold(chalk.red("Dashboard validation error")));
      console.log(message);
      throw new Error(message);
    }
  });

  return promises;
}

export default {
  validate,
}
