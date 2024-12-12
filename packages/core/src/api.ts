import type { HistoryDataPoint, KnownTestFailure } from "@allure/core-api";
import type { Plugin, QualityGateConfig, ReportFiles } from "@allure/plugin-api";
import type { ResultsReader } from "@allure/reader-api";

export interface FullConfig {
  name: string;
  output: string;
  reportFiles: ReportFiles;
  readers?: ResultsReader[];
  plugins?: PluginInstance[];
  history?: HistoryDataPoint[];
  historyPath?: string;
  appendHistory?: boolean;
  known?: KnownTestFailure[];
  qualityGate?: QualityGateConfig;
  // TODO: https://github.com/qameta/allure3/issues/180
  realTime?: any;
}

export interface PluginInstance {
  id: string;
  enabled: boolean;
  plugin: Plugin;
  options: Record<string, any>;
}
