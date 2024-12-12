import { readRuntimeConfig } from "@allure/core";
import { serve } from "@allure/static-server";
import { createCommand } from "../utils/commands.js";

type CommandOptions = {
  config?: string;
  port?: number;
  live: boolean;
};

export const OpenCommandAction = async (reportDir: string | undefined, options: CommandOptions) => {
  const { config: configPath, port, live } = options;
  const config = await readRuntimeConfig(configPath, undefined, reportDir);

  await serve({
    port: port,
    servePath: config.output,
    live: Boolean(live),
    open: true,
  });
};

export const OpenCommand = createCommand({
  name: "open [reportDir]",
  description: "Serves specified directory",
  options: [
    [
      "--config, -c <file>",
      {
        description: "The path Allure config file",
      },
    ],
    [
      "--port <string>",
      {
        description: "The port to serve the reports on. If not set, the server starts on a random port",
      },
    ],
    [
      "--live",
      {
        description: "Reload pages on any file change in the served directory",
        default: false,
      },
    ],
  ],
  action: OpenCommandAction,
});
