import auth from "./paths/auth";
import queries from "./paths/queries";
import alerts from "./paths/alerts";
import alertChecks from "./paths/alert-checks";
import deployments from "./paths/deployments";
import queryRuns from "./paths/query-runs";
import services from "./paths/services";
import events from "./paths/events";
import cli from "./paths/cli";
import iam from "./paths/iam";
import aws from "./paths/aws";
import templates from "./paths/templates";
import diffs from "./paths/diffs";
import infrastructure from "./paths/infrastructure";
import reports from "./paths/reports";
import slack from "./paths/slack";
import keys from "./paths/keys";
import onboarding from "./paths/onboarding";
import explain from "./paths/explain";
import environments from "./paths/environments";
import rehydrate from "./paths/rehydrate";
import markers from "./paths/markers";
import datasets from "./paths/datasets";
import dashboards from "./paths/dashbaords";

export default {
  ...auth,
  ...queries,
  ...alerts,
  ...deployments,
  ...queryRuns,
  ...services,
  ...events,
  ...cli,
  ...iam,
  ...aws,
  ...templates,
  ...diffs,
  ...infrastructure,
  ...reports,
  ...alertChecks,
  ...slack,
  ...keys,
  ...onboarding,
  ...explain,
  ...environments,
  ...rehydrate,
  ...markers,
  ...datasets,
  ...dashboards,
};
