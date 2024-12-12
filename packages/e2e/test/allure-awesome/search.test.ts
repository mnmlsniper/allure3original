import { AllureReport, FileSystemReportFiles } from "@allure/core";
import AllureAwesomePlugin from "@allure/plugin-awesome";
import type { AllureStaticServer } from "@allure/static-server";
import { serve } from "@allure/static-server";
import { expect, test } from "@playwright/test";
import { layer } from "allure-js-commons";
import { Stage, Status } from "allure-js-commons";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { generateTestResults } from "../utils/index.js";

let server: AllureStaticServer;
let host: string;
let allureTestResultsDir: string;
let allureReportDir: string;

test.beforeAll(async () => {
  const now = Date.now();
  const temp = tmpdir();

  allureTestResultsDir = await mkdtemp(resolve(temp, "allure-results-"));
  allureReportDir = await mkdtemp(resolve(temp, "allure-report-"));

  const report = new AllureReport({
    name: "sample",
    output: allureReportDir,
    reportFiles: new FileSystemReportFiles(allureReportDir),
    plugins: [
      {
        id: "awesome",
        enabled: true,
        plugin: new AllureAwesomePlugin({}),
        options: {},
      },
    ],
  });

  generateTestResults(allureTestResultsDir, [
    {
      name: "0 sample test",
      fullName: "sample.js#0 sample passed test",
      status: Status.PASSED,
      stage: Stage.FINISHED,
      start: now,
      stop: now + 1000,
    },
    {
      name: "1 flaky test",
      fullName: "sample.js#1 sample failed test",
      status: Status.FAILED,
      stage: Stage.FINISHED,
      start: now + 1000,
      stop: now + 2000,
      statusDetails: {
        message: "Assertion error: Expected 1 to be 2",
        trace: "failed test trace",
      },
    },
  ]);
  await report.start();
  await report.readDirectory(allureTestResultsDir);
  await report.done();

  server = await serve({
    servePath: resolve(allureReportDir, "./awesome"),
  });
  host = `http://localhost:${server.port}`;
});

test.afterAll(async () => {
  try {
    await rm(allureTestResultsDir, { recursive: true });
    await rm(allureReportDir, { recursive: true });
  } catch (ignored) {}

  await server?.stop();
});

test.beforeEach(async ({ page }) => {
  await layer("e2e");
  await page.goto(host);
});

test("search filters tests on typing", async ({ page }) => {
  await expect(page.getByTestId("tree-leaf")).toHaveCount(2);
  await page.getByTestId("search-input").fill("0 sample");
  await expect(page.getByTestId("tree-leaf")).toHaveCount(1);
});
