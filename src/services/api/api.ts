import auth from "./paths/auth";
import queries from "./paths/queries";
import alerts from "./paths/alerts";
import alertChecks from "./paths/alert-checks";
import deployments from "./paths/deployments";
import queryRuns from "./paths/query-runs";
import services from "./paths/services";
import namespaces from "./paths/namespaces";
import events from "./paths/events";
import cli from "./paths/cli";
import iam from "./paths/iam";
import environments from "./paths/environments";
import templates from "./paths/templates";
import diffs from "./paths/diffs";
import infrastructure from "./paths/infrastructure";
import reports from "./paths/reports";

export default {
  ...auth,
  ...queries,
  ...alerts,
  ...deployments,
  ...queryRuns,
  ...services,
  ...namespaces,
  ...events,
  ...cli,
  ...iam,
  ...environments,
  ...templates,
  ...diffs,
  ...infrastructure,
  ...reports,
  ...alertChecks
};
