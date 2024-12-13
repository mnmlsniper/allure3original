import { AllureReport, FileSystemReportFiles, type FullConfig } from "@allure/core";
import AllureAwesomePlugin from "@allure/plugin-awesome";
import { type TestResult } from "allure-js-commons";
import { FileSystemWriter, ReporterRuntime } from "allure-js-commons/sdk/reporter";
import { readdirSync } from "node:fs"

export const randomNumber = (min: number, max: number) => {
  if (min > max) {
    [min, max] = [max, min];
  }

  return Math.random() * (max - min) + min;
};

export const generateTestResults = async (payload: {
  reportDir: string;
  resultsDir: string;
  testResults: Partial<TestResult>[];
  reportConfig: Omit<FullConfig, "output" | "reportFiles">;
}) => {
  const { reportConfig, reportDir, resultsDir, testResults } = payload;
  const report = new AllureReport({
    plugins: [
      {
        id: "awesome",
        enabled: true,
        plugin: new AllureAwesomePlugin({}),
        options: {},
      },
    ],
    ...reportConfig,
    output: reportDir,
    reportFiles: new FileSystemReportFiles(reportDir),
  });
  const runtime = new ReporterRuntime({
    writer: new FileSystemWriter({
      resultsDir,
    }),
  });
  const scopeUuid = runtime.startScope();

  testResults.forEach((tr) => {
    runtime.writeTest(runtime.startTest(tr, [scopeUuid]));
  });
  runtime.writeScope(scopeUuid);

  await report.start();
  await report.readDirectory(resultsDir);
  await report.done();
};
