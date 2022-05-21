#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const version = () => { return require('../package').version; }

yargs(hideBin(process.argv))
  .commandDir("commands")
  .demandCommand()
  .usage("The power of Baselime in the command-line")
  .recommendCommands()
  .wrap(yargs.terminalWidth())
  .help("help", "Show this help output, or the help for a specified command or subcommand")
  .version("version", "Show the current Baselime CLI version", version())
  .strict()
  .alias({ h: "help", v: "version" })
  .argv;
