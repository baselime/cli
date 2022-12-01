import spinner from "../../../services/spinner/index";
import api from "../../../services/api/api";
import outputs from "./outputs";
import pushHandlers from "../../push/handlers/handlers";

async function create(path: string) {
  const s = spinner.get();
  s.start("Creates a template");
  const {metadata, resources} = await pushHandlers.validate(path);

  const template = await api.templateCreate({
    resources,
    name: metadata.application,
    description: metadata.description,
    public: true,
  });
  s.succeed();
  outputs.create(template, "json");
}

export default {
  create,
};
