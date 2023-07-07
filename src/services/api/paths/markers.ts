import { client } from "../clients";

export type Marker = {
  id: string;
  name?: string;
  description?: string;
  workspaceId: string;
  environmentId: string;
  service: string;
  userId: string;
  startTime: number;
  endTime?: number;
  created?: string;
  updated?: string;
  type?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export interface MarkerCreateParams {
  service: string;
  name?: string;
  description?: string;
  startTime: number;
  endTime?: number;
  type?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

async function markerCreate(marker: MarkerCreateParams): Promise<Marker> {
  const res = (await client.post("/markers", marker)).data;
  return res.marker;
}

export default {
  markerCreate,
};
