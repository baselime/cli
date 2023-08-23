import { client } from "../clients";

export interface Dataset {
  workspaceId: string;
  environmentId: string;
  id: string;
  userId: string;
  description?: string;
  generated: boolean;
  keys: {
    exclude: string[];
    obfuscate: string[];
    scrub: boolean;
  };
  namespaces: {
    exclude: string[];
  };
  services?: {
    exclude: string[];
  };
  enabled: boolean;
  blocked: boolean;
  created?: string;
  updated?: string;
}

async function datasetsList(): Promise<Dataset[]> {
  const res = (await client.get("/datasets")).data;
  return res.datasets;
}

export default {
  datasetsList,
};
