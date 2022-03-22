import spinner from "../../services/spinner/index";
import api from "../../services/api/api";
import outputs from "./outputs";

async function list(json: boolean, application?: string) {
  const s = spinner.get();
  s.start("Fetching your queries");
  const queries = await api.queriesList(application);
  s.succeed();
  outputs.list(queries, json);
}

export default {
  list,
};
