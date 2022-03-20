import { Query } from "../../services/api/paths/queries";

function list(queries: Query[], json: boolean) {
  if (json) {
    console.log("json");
    console.log(JSON.stringify(queries));
    return;
  }
  console.log("table");
  console.log(queries);
}

export default {
  list,
}
