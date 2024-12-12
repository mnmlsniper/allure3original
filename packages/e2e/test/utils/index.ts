import { type TestResult } from "allure-js-commons";
import { FileSystemWriter, ReporterRuntime } from "allure-js-commons/sdk/reporter";

export const randomNumber = (min: number, max: number) => {
  if (min > max) {
    [min, max] = [max, min];
  }

  return Math.random() * (max - min) + min;
};

export const generateTestResults = (resultsDir: string, trs: Partial<TestResult>[]) => {
  const runtime = new ReporterRuntime({
    writer: new FileSystemWriter({
      resultsDir,
    }),
  });
  const scopeUuid = runtime.startScope();

  trs.forEach((tr) => {
    runtime.writeTest(runtime.startTest(tr, [scopeUuid]));
  });
  runtime.writeScope(scopeUuid);
};
