import type { Config, PluginDescriptor } from "@allurereport/plugin-api";
import type { QualityGateConfig } from "@allurereport/plugin-api";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as process from "node:process";
import type { FullConfig, PluginInstance } from "./api.js";
import { readHistory } from "./history.js";
import { readKnownIssues } from "./known.js";
import { FileSystemReportFiles } from "./plugin.js";
import { importWrapper } from "./utils/module.js";

export { defineConfig } from "@allurereport/plugin-api";

export const createConfig = async (opts: {
  reportName?: string;
  output?: string;
  historyPath?: string;
  knownIssuesPath?: string;
  plugins?: PluginInstance[];
  qualityGate?: QualityGateConfig;
  cwd?: string;
}): Promise<FullConfig> => {
  const {
    reportName = "Allure Report",
    output = "allure-report",
    historyPath,
    knownIssuesPath,
    qualityGate,
    cwd,
  } = opts;
  const workingDirectory = cwd ?? process.cwd();
  const target = resolve(workingDirectory, output);
  const history = historyPath ? await readHistory(resolve(workingDirectory, historyPath)) : [];
  const known = knownIssuesPath ? await readKnownIssues(resolve(workingDirectory, knownIssuesPath)) : [];

  return {
    name: reportName,
    history,
    historyPath,
    known,
    qualityGate,
    plugins: opts.plugins ?? [],
    reportFiles: new FileSystemReportFiles(target),
    output: target,
  };
};

const defaultRuntimeConfig: Config = {};

export const getPluginId = (key: string) => {
  return key.replace(/^@.*\//, "").replace(/[/\\]/g, "-");
};

export const findRuntimeConfigPath = async (cwd: string = process.cwd()): Promise<string | undefined> => {
  const files = await readdir(cwd);

  if (files.includes("allurerc.js")) {
    return join(cwd, "allurerc.js");
  }

  if (files.includes("allurerc.mjs")) {
    return join(cwd, "allurerc.mjs");
  }

  return undefined;
};

// more advanced override, e.g. default plugins
export const readRuntimeConfig = async (
  configPath?: string,
  cwd?: string,
  output?: string,
  name?: string,
): Promise<FullConfig> => {
  const runtimeConfigPath = !configPath ? await findRuntimeConfigPath(cwd) : resolve(cwd ?? process.cwd(), configPath);
  const runtimeConfig = runtimeConfigPath ? await loadConfig(runtimeConfigPath) : defaultRuntimeConfig;

  return await resolveConfig(runtimeConfig, { output, name });
};

export const loadConfig = async (configPath: string): Promise<Config> => {
  return (await import(configPath)).default;
};

export const resolveConfig = async (
  config: Config,
  override: { name?: string; output?: string } = {},
): Promise<FullConfig> => {
  const { plugins = {}, name, output, historyPath, ...rest } = config;
  const pluginInstances = await resolvePlugins(plugins);
  const out = resolve(override.output ?? output ?? "./allure-report");
  const history = historyPath ? await readHistory(historyPath) : [];

  return {
    ...rest,
    name: override.name ?? name ?? "Allure Report",
    reportFiles: new FileSystemReportFiles(out),
    plugins: pluginInstances,
    output: out,
    history,
    historyPath,
  };
};

export const resolvePlugin = async (path: string) => {
  // try to append @allurereport/plugin- scope
  if (!path.startsWith("@allurereport/plugin-")) {
    try {
      const module = await importWrapper(`@allurereport/plugin-${path}`);

      return module.default;
    } catch (err) {}
  }

  try {
    const module = await importWrapper(path);

    return module.default;
  } catch (err) {
    throw new Error(`Cannot resolve plugin: ${path}`);
  }
};

const resolvePlugins = async (plugins: Record<string, PluginDescriptor>) => {
  const pluginInstances: PluginInstance[] = [];

  for (const id in plugins) {
    const pluginConfig = plugins[id];
    const Plugin = await resolvePlugin(pluginConfig.import ?? id);

    pluginInstances.push({
      id: getPluginId(id),
      enabled: pluginConfig.enabled ?? true,
      options: pluginConfig.options ?? {},
      plugin: new Plugin(pluginConfig.options),
    });
  }

  return pluginInstances;
};
