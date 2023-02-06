import { client } from "../clients";

export declare enum TutorialType {
  video = "video",
  docs = "docs",
}
export const enum Stage {
  ACTIVATE = "ACTIVATE",
  CREATE_WORKSPACE = "CREATE_WORKSPACE",
  CONNECT_ENVIRONMENT = "CONNECT_ENVIRONMENT",
  INVITE_TEAM_MATE = "INVITE_TEAM_MATE",
  VISUALISE_EVENTS = "VISUALISE_EVENTS",
  DOWNLOAD_CLI = "DOWNLOAD_CLI",
  DOWNLOAD_VS_CODE_EXTENSION = "DOWNLOAD_VS_CODE_EXTENSION",
  CREATE_APPLICATION = "CREATE_APPLICATION",
  ADD_TO_CI = "ADD_TO_CI",
  RUN_QUERY = "RUN_QUERY",
  RUN_SEARCH = "RUN_SEARCH",
  SET_ALERT = "SET_ALERT",
}
export interface UserStage {
  id: Stage;
  completed: boolean;
  date?: string;
}
export interface Onboarding {
  id: string;
  stages: UserStage[];
  tutorials: {
    id: string;
    completed: boolean;
    type: TutorialType;
  }[];
}

async function getOnboardingStatus(token?: string) {
  const res = await client.get("/onboarding", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.onboarding as Onboarding;
}

async function editOnboardingStatus(data: { token: string; stage: Stage; completed: Boolean; tutorial?: string }) {
  const { stage, completed, tutorial, token } = data;
  await client.put(
    "/onboarding",
    {
      stage,
      completed,
      tutorial,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export default {
  getOnboardingStatus,
  editOnboardingStatus,
};
