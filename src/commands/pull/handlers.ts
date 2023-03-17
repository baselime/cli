import { ResourceMap } from "../../services/parser/parser";
import spinner from "../../services/spinner";
import { verifyPlan } from "../push/handlers/handlers";
import checks, {
  DeploymentAlert,
  DeploymentQuery, DeploymentResources,
  UserVariableInputs
} from "../push/handlers/validators";
import {promptService} from "./prompts";
import fs from "fs";
import {prompt} from "enquirer";
import api from "../../services/api/api";
import yaml from "yaml";
import {Query} from "../../services/api/paths/queries";
import {Alert} from "../../services/api/paths/alerts";
import {query} from "express";

async function pull(directory: string, stage: string, userVariableInputs: UserVariableInputs, noAsk: boolean = false) {
  await checkIfDirectoryIsRaw(directory);
  const s = spinner.get();
  s.start("Checking resources to import...");
  let localResources = await checks.readResources(directory, stage, userVariableInputs);
  // write
  const remoteQueries = await getRemoteQueries(directory, localResources.metadata.service, localResources.resourcesByKind.queries);
  const remoteAlerts = await getRemoteAlerts(directory, localResources.metadata.service, localResources.resourcesByKind.alerts);
  const {onlyRemote, combinedResources} = combineResources(localResources.resourcesByKind, {
    alerts: remoteAlerts,
    queries: remoteQueries,
  });
  await writeRemoteResourcesLocally(directory, onlyRemote);
  await verifyPlan(localResources.metadata, combinedResources, false);
}

type CombineResourcesResult = {
  combinedResources: DeploymentResources,
  onlyRemote: {
    queries: DeploymentQueryDictionary
    alerts: DeploymentAlertDictionary,
  }
}

function combineResources(
    localResources: DeploymentResources,
    remoteResources: {
      queries: DeploymentQueryDictionary,
      alerts: DeploymentAlertDictionary,
    },
): (CombineResourcesResult) {
  const onlyRemote: {
    queries: DeploymentQueryDictionary,
    alerts: DeploymentAlertDictionary,
  } = {
    queries: {},
    alerts: {},
  }
  for (const queryId of Object.keys(remoteResources.queries)) {
    let remoteQuery = remoteResources.queries[queryId];
    if(!localResources.queries.some(localQuery => localQuery.id === remoteQuery.id)) {
      localResources.queries.push(remoteQuery);
      onlyRemote.queries[queryId] = remoteQuery;
    }
  }
  for (const alertId of Object.keys(remoteResources.alerts)) {
    let remoteAlert = remoteResources.alerts[alertId];
    if(!localResources.alerts.some(localAlert => localAlert.id === remoteAlert.id)) {
      localResources.alerts.push(remoteAlert);
      onlyRemote.alerts[alertId] = remoteAlert;
    }
  }
  return {
    combinedResources: localResources,
    onlyRemote
  };
}

async function checkIfDirectoryIsRaw(directory: string): Promise<void> {
  try {
    await fs.accessSync(".baselime");
  } catch(err: any) {
    if (err && err.code === 'ENOENT') {
      const { name } = await prompt<{ name: string }>({
        type: "select",
        name: "name",
        message: `The configuration directory ${directory} does not exist. Would you like to initialise?`,
        choices: [{ name: "Yes" }, { name: "No" }],
      });
      if (name === "Yes") {
        await tryInitialiseForService(directory);
      }
    }
  }
}

async function tryInitialiseForService(directory: string): Promise<string> {
  const service = await promptService();
  if (!service) {
    process.exit(0);
  }
  const serviceData = await api.serviceGet(service);
  await fs.mkdirSync(directory, {recursive: true});
  const indexYamlData = {
    ...serviceData.metadata,
    service: service,
    templates: convertTemplates((serviceData.metadata as any).templates)
  }
  await fs.writeFileSync(`${directory}/index.yml`, yaml.stringify(indexYamlData));
  return service;
  // await writeTemplates(directory, (serviceData.metadata as any).templates)
  // await init(directory, service, description, "aws", undefined);
}

interface Template {
  name: string;
  applyOnSave: boolean;
  workspaceId: string
}

function convertTemplates(templates: Template[]) {
  if(!templates) return [];
  return templates.map(template => ({
    name: `${template.workspaceId}/${template.name}`,
  }));
}

type DeploymentQueryDictionary = Record<string, DeploymentQuery>
type DeploymentAlertDictionary = Record<string, DeploymentAlert>

async function getRemoteQueries(directory: string, service: string, localQueries: DeploymentQuery[] | undefined): Promise<DeploymentQueryDictionary> {
  spinner.get().info("Downloading queries");
  const queries = await api.queriesList(service);
  const queriesDict: DeploymentQueryDictionary = {};
  for (const query of queries) {
    if(!localQueries?.some(localQuery=> localQuery.id == query.id)) {
      queriesDict[query.id] = convertQuery(query);
    }
  }
  // if (Object.keys(queriesDict).length > 0) {
  //   await fs.appendFileSync(`${directory}/queries.yaml`, "\n" + yaml.stringify(queriesDict));
  // }
  spinner.get().succeed("Queries downloaded");
  return queriesDict;
}

function convertQuery(query: Query): DeploymentQuery {
  return {
    type: "query",
    id: query.id,
    properties: {
      name: query.name,
      description: query.description,
      parameters: {
        datasets: query.parameters.datasets,
        needle: query.parameters.needle ? {
          isRegex: query.parameters.needle?.isRegex || false,
          value: query.parameters.needle?.item || "",
          matchCase: query.parameters.needle.matchCase,
        } : undefined,
        groupBy: query.parameters.groupBy,
        filterCombination: query.parameters.filterCombination,
        filters: query.parameters.filters?.map(filter => (`${filter.key} ${filter.operation} ${filter.value}`)),
        calculations: query.parameters.calculations?.map(calculation => {
          return calculation.operator === "COUNT" ?
              "COUNT" :
              `${calculation.operator}(${calculation.key})`
        })
      }
    }
  }
}

async function getRemoteAlerts(directory: string, service: string, localAlerts?: DeploymentAlert[]): Promise<DeploymentAlertDictionary> {
  spinner.get().info("Downloading alerts");
  const alerts = await api.alertsList(service);
  const alertsDict: DeploymentAlertDictionary = {};
  for (const alert of alerts) {
    if(!localAlerts?.some(localQuery=> localQuery.id == alert.id)) {
      alertsDict[alert.id] = convertAlert(alert);
    }
  }
  // if (Object.keys(alertsDict).length > 0) {
  //   await fs.appendFileSync(`${directory}/alerts.yaml`, "\n" + yaml.stringify(alertsDict));
  // }
  spinner.get().succeed("Queries downloaded");
  return alertsDict;
}

function convertAlert(alert: Alert): DeploymentAlert {
  return {
    type: "alert",
    id: alert.id,
    properties: {
      description: alert.description,
      parameters: {
        frequency: alert.parameters.frequency,
        window: alert.parameters.window,
        query: alert.parameters.queryId,
        threshold: `${alert.parameters.threshold.operation} ${alert.parameters.threshold.value}`,
      },
      name: alert.name,
      enabled: alert.enabled,
      channels: alert.channels
    }
  }
}

type DeploymentResourcesGroup = {
  queries: DeploymentQueryDictionary
  alerts: DeploymentAlertDictionary,
}
async function writeRemoteResourcesLocally(directory: string, remoteResources: DeploymentResourcesGroup) {
  for (const kind of Object.keys(remoteResources)) {
    const resourcesOfAKind = remoteResources[kind as keyof DeploymentResourcesGroup];
    if (Object.keys(resourcesOfAKind).length > 0) {
      await fs.appendFileSync(`${directory}/${kind}.yaml`, "\n" + yaml.stringify(resourcesOfAKind));
    }
  }
}


export default {
  pull,
};
