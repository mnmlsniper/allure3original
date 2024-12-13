import type { AllureStaticServer } from "@allurereport/static-server";
import { serve } from "@allurereport/static-server";
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

  await generateTestResults({
    reportConfig: {
      name: "Sample allure report"
    },
    resultsDir: allureTestResultsDir,
    reportDir: allureReportDir, 
    testResults: [
      {
        name: "0 sample passed test",
        fullName: "sample.js#0 sample passed test",
        status: Status.PASSED,
        stage: Stage.FINISHED,
        start: now,
        stop: now + 1000,
      },
    ]
  });

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

test.describe("allure-awesome", () => {
  test.describe("report options", () => {
    test("report title and page title contain give report name", async ({ page }) => {
      await expect(page.getByTestId("report-title")).toHaveText("Sample allure report");
      expect(await page.title()).toBe("Sample allure report");
    });
  })
})


