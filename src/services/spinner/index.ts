import ora from "ora";

let spinner: ora.Ora;

function init(quiet: boolean): ora.Ora {
  spinner = ora({
    isSilent: quiet,
  });
  return spinner;
}

function get(): ora.Ora {
  return spinner;
}

export default {
  init,
  get,
};
