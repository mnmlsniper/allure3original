import { AllureReport, FileSystemReportFiles } from "@allurereport/core";
import AllureAwesomePlugin from "@allurereport/plugin-awesome";
import type { AllureStaticServer } from "@allurereport/static-server";
import { serve } from "@allurereport/static-server";
import { expect, test } from "@playwright/test";
import { layer } from "allure-js-commons";
import { Stage, Status } from "allure-js-commons";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { generateTestResults, randomNumber } from "../utils/index.js";

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
    name: "sample allure report",
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
      name: "0 sample passed test",
      fullName: "sample.js#0 sample passed test",
      status: Status.PASSED,
      stage: Stage.FINISHED,
      start: now,
      stop: now + 1000,
    },
    {
      name: "1 sample failed test",
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
    {
      name: "2 sample broken test",
      fullName: "sample.js#2 sample broken test",
      status: Status.BROKEN,
      stage: Stage.FINISHED,
      start: now + 2000,
      stop: now + 3000,
      statusDetails: {
        message: "An unexpected error",
        trace: "broken test trace",
      },
    },
    {
      name: "3 sample skipped test",
      fullName: "sample.js#3 sample skipped test",
      start: now + 3000,
      stop: now + 3000,
      status: Status.SKIPPED,
    },
    {
      name: "4 sample unknown test",
      fullName: "sample.js#4 sample unknown test",
      status: undefined,
      start: now + 4000,
      stage: Stage.PENDING,
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

test("report title and page title contain give report name", async ({ page }) => {
  await expect(page.getByTestId("report-title")).toHaveText("sample allure report");
  expect(await page.title()).toBe("sample allure report");
});

test("all types of tests are displayed", async ({ page }) => {
  const treeLeaves = page.getByTestId("tree-leaf");

  await expect(treeLeaves).toHaveCount(5);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("0 sample passed test");
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-status-passed")).toBeVisible();
  await expect(treeLeaves.nth(1).getByTestId("tree-leaf-title")).toHaveText("1 sample failed test");
  await expect(treeLeaves.nth(1).getByTestId("tree-leaf-status-failed")).toBeVisible();
  await expect(treeLeaves.nth(2).getByTestId("tree-leaf-title")).toHaveText("2 sample broken test");
  await expect(treeLeaves.nth(2).getByTestId("tree-leaf-status-broken")).toBeVisible();
  await expect(treeLeaves.nth(3).getByTestId("tree-leaf-title")).toHaveText("3 sample skipped test");
  await expect(treeLeaves.nth(3).getByTestId("tree-leaf-status-skipped")).toBeVisible();
  await expect(treeLeaves.nth(4).getByTestId("tree-leaf-title")).toHaveText("4 sample unknown test");
  await expect(treeLeaves.nth(4).getByTestId("tree-leaf-status-unknown")).toBeVisible();
});

test("statistics in metadata renders information about the tests", async ({ page }) => {
  await expect(page.getByTestId("metadata-item-total").getByTestId("metadata-value")).toHaveText("5");
  await expect(page.getByTestId("metadata-item-passed").getByTestId("metadata-value")).toHaveText("1");
  await expect(page.getByTestId("metadata-item-failed").getByTestId("metadata-value")).toHaveText("1");
  await expect(page.getByTestId("metadata-item-broken").getByTestId("metadata-value")).toHaveText("1");
  await expect(page.getByTestId("metadata-item-skipped").getByTestId("metadata-value")).toHaveText("1");
  await expect(page.getByTestId("metadata-item-unknown").getByTestId("metadata-value")).toHaveText("1");
});

test("tree tabs filter tests by the status", async ({ page }) => {
  const treeLeaves = page.getByTestId("tree-leaf");

  await expect(treeLeaves).toHaveCount(5);

  await page.getByTestId("tab-passed").click();
  await expect(treeLeaves).toHaveCount(1);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("0 sample passed test");

  await page.getByTestId("tab-failed").click();
  await expect(treeLeaves).toHaveCount(1);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("1 sample failed test");

  await page.getByTestId("tab-broken").click();
  await expect(treeLeaves).toHaveCount(1);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("2 sample broken test");

  await page.getByTestId("tab-skipped").click();
  await expect(treeLeaves).toHaveCount(1);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("3 sample skipped test");

  await page.getByTestId("tab-unknown").click();
  await expect(treeLeaves).toHaveCount(1);
  await expect(treeLeaves.nth(0).getByTestId("tree-leaf-title")).toHaveText("4 sample unknown test");

  await page.getByTestId("tab-all").click();
  await expect(treeLeaves).toHaveCount(5);
});

test("test result page opens after test result click", async ({ page }) => {
  const passedLeaf = page.getByTestId("tree-leaf").nth(0);

  await passedLeaf.click();

  await expect(page.getByTestId("test-result-info-title")).toHaveText("0 sample passed test");
  await expect(page.getByTestId("tree-leaf-status-passed")).toBeVisible();
  await expect(page.getByTestId("test-result-fullname")).toHaveText("sample.js#0 sample passed test");
});

test("it's possible to navigate between tests results using navigation arrows", async ({ page }) => {
  const randomLeaf = page.getByTestId("tree-leaf").nth(randomNumber(0, 4));

  await randomLeaf.click();

  const testTitleText = await page.getByTestId("test-result-info-title").textContent();
  const navCounterText = await page.getByTestId("test-result-nav-current").textContent();
  const pressPrevArrow = await page.getByTestId("test-result-nav-next").isDisabled();

  if (pressPrevArrow) {
    await page.getByTestId("test-result-nav-prev").click();
  } else {
    await page.getByTestId("test-result-nav-next").click();
  }

  await expect(page.getByTestId("test-result-nav-current")).not.toHaveText(navCounterText);
  await expect(page.getByTestId("test-result-info-title")).not.toHaveText(testTitleText);

  if (pressPrevArrow) {
    await page.getByTestId("test-result-nav-next").click();
  } else {
    await page.getByTestId("test-result-nav-prev").click();
  }

  await expect(page.getByTestId("test-result-nav-current")).toHaveText(navCounterText);
  await expect(page.getByTestId("test-result-info-title")).toHaveText(testTitleText);
});

test("test result fullname copies to clipboard", async ({ page, context }) => {
  const passedLeaf = page.getByTestId("tree-leaf").nth(0);

  await passedLeaf.click();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("test-result-fullname-copy").click();

  const handle = await page.evaluateHandle(() => globalThis.navigator.clipboard.readText());
  const clipboardContent = await handle.jsonValue();

  expect(clipboardContent).toEqual("sample.js#0 sample passed test");
});

test("failed test contains error message and stack", async ({ page }) => {
  await page.getByTestId("tree-leaf-status-failed").click();
  await expect(page.getByTestId("test-result-error-message")).toHaveText("Assertion error: Expected 1 to be 2");
  await expect(page.getByTestId("test-result-error-trace")).not.toBeVisible();
  await page.getByTestId("test-result-error-message").click();
  await expect(page.getByTestId("test-result-error-trace")).toHaveText("failed test trace");
});

test("broken test contains error message and stack", async ({ page }) => {
  await page.getByTestId("tree-leaf-status-broken").click();
  await expect(page.getByTestId("test-result-error-message")).toHaveText("An unexpected error");
  await expect(page.getByTestId("test-result-error-trace")).not.toBeVisible();
  await page.getByTestId("test-result-error-message").click();
  await expect(page.getByTestId("test-result-error-trace")).toHaveText("broken test trace");
});
