import {client} from "../clients";

type MarkerListParams = {
    service: string;
    timeframe: {
        from: number;
        to: number;
    }
}

export interface Marker {
    id: string;
    name?: string;
    description?: string;
    workspaceId: string;
    environmentId: string;
    service: string;
    userId: string;
    startTime: number;
    endTime: number;
}

export async function markersList(params: MarkerListParams): Promise<Marker[]> {
    const res = (await client.get(`/markers/${params.service}`, { params: {  } })).data;
    return res.markers;
}

type MarkerCreateParams = {
    service: string;
    name: string;
    description: string;
    startTime: number;
    endTime?: number;
    type: string;
}

export async function markersCreate(params: MarkerCreateParams): Promise<Marker[]> {
    const res = (await client.post(`/markers`, {
        ...params
    })).data;
    return res.marker;
}