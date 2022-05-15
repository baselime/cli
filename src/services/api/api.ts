import auth from "./paths/auth";
import queries from "./paths/queries";
import alerts from "./paths/alerts";
import deployments from "./paths/deployments";
import queryRuns from "./paths/query-runs";
import applications from "./paths/applications";
import namespaces from "./paths/namespaces";

export default {
  ...auth,
  ...queries,
  ...alerts,
  ...deployments,
  ...queryRuns,
  ...applications,
  ...namespaces,
};
