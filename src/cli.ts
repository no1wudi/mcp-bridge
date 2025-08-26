#!/usr/bin/env node

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { startServer } from "./index.js";

const argv = yargs(hideBin(process.argv))
  .option("port", {
    alias: "p",
    type: "number",
    description: "Server port",
    default: 3000,
  })
  .option("cwd", {
    alias: "c",
    type: "string",
    description: "Working directory path",
    default: process.cwd(),
  })
  .option("config", {
    alias: "f",
    type: "string",
    description: "Path to tools configuration file",
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Enable verbose logging",
    default: false,
  })
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "V")
  .parseSync();

// Start server with parsed arguments
startServer({
  port: argv.port,
  cwd: argv.cwd,
  configPath: argv.config,
  verbose: argv.verbose,
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
