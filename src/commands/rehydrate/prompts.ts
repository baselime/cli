import chalk from "chalk";
import { prompt } from "enquirer";
import api from "../../services/api/api";
import spinner from "../../services/spinner";
import { Account } from "../../services/api/paths/environments";

export async function promptSelectAccount(): Promise<Account> {
  const s = spinner.get();
  s.start("Fetching your accounts");
  const envs = await api.getEnvironment();
  s.succeed();

  if (envs.accounts.length === 0) {
    throw new Error("No connected account found in this workspace.");
  }

  const accountMap: Record<string, Account> = {};
  envs.accounts.forEach((account) => {
    accountMap[`${account.id} (${account.region})`] = account;
  });

  const { name } = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `${chalk.bold("Select an account")}`,
    choices: Object.keys(accountMap),
  });

  return accountMap[name];
}
