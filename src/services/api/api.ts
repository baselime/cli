import auth from "./paths/auth";
import queries from "./paths/queries";
import alerts from "./paths/alerts";
import polaris from "./paths/polaris";
import queryRuns from "./paths/query-runs";

export default {
  ...auth,
  ...queries,
  ...alerts,
  ...polaris,
  ...queryRuns,
};
