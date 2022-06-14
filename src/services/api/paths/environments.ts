import { publicClient } from "../clients";

interface CFTemplateGenerateParams {
  otp: string;
  account: string;
  region: string;
  alias: string;
}

async function cfTeamplateGenerate(params: CFTemplateGenerateParams): Promise<{ url: string; }> {
  const res = (await publicClient.put(`/environments/aws/cloudformation-template`, params)).data;
  return res;
}

export default {
  cfTeamplateGenerate
};
