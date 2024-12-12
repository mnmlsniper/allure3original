import { AllureReport, FileSystemReportFiles } from "@allure/core";
import AllureAwesomePlugin from "@allure/plugin-awesome";
import type { AllureStaticServer } from "@allure/static-server";
import { serve } from "@allure/static-server";
import { expect, test } from "@playwright/test";
import { layer } from "allure-js-commons";
import { Stage, Status } from "allure-js-commons";
import { FileSystemWriter, ReporterRuntime } from "allure-js-commons/sdk/reporter";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

let server: AllureStaticServer;
let host: string;
let allureTestResultsDir: string;
let allureReportDir: string;

const generateTestResults = () => {
  const runtime = new ReporterRuntime({
    writer: new FileSystemWriter({
      resultsDir: allureTestResultsDir,
    }),
  });
  const scopeUuid = runtime.startScope();
  const now = Date.now();

  runtime.writeTest(
    runtime.startTest(
      {
        name: "0 sample passed test",
        fullName: "sample.js#0 sample passed test",
        status: Status.PASSED,
        stage: Stage.FINISHED,
        start: now,
        stop: now + 1000,
      },
      [scopeUuid],
    ),
  );
  runtime.writeTest(
    runtime.startTest(
      {
        name: "1 sample failed test",
        fullName: "sample.js#1 sample failed test",
        status: Status.FAILED,
        stage: Stage.FINISHED,
        start: now + 1000,
        stop: now + 2000,
        statusDetails: {
          message: "Assertion error: Expected 1 to be 2",
          trace: "trace",
        },
      },
      [scopeUuid],
    ),
  );
  runtime.writeTest(
    runtime.startTest(
      {
        name: "2 sample broken test",
        fullName: "sample.js#2 sample broken test",
        status: Status.BROKEN,
        stage: Stage.FINISHED,
        start: now + 2000,
        stop: now + 3000,
        statusDetails: {
          message: "An unexpected error",
          trace: "trace",
        },
      },
      [scopeUuid],
    ),
  );
  runtime.writeTest(
    runtime.startTest(
      {
        name: "3 sample skipped test",
        fullName: "sample.js#3 sample skipped test",
        start: now + 3000,
        stop: now + 3000,
        status: Status.SKIPPED,
      },
      [scopeUuid],
    ),
  );
  runtime.writeTest(
    runtime.startTest(
      {
        name: "4 sample unknown test",
        fullName: "sample.js#4 sample unknown test",
        status: undefined,
        start: now + 4000,
        stage: Stage.PENDING,
      },
      [scopeUuid],
    ),
  );
  runtime.writeScope(scopeUuid);
};

test.beforeAll(async () => {
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

  generateTestResults();
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

test.skip("it's possible to navigate between test results using navigation arrows", async ({ page }) => {
  const passedLeaf = page.getByTestId("tree-leaf").nth(0);

  await passedLeaf.click();

  await expect(page.getByTestId("test-result-nav-current")).toHaveText("1/5");
  await page.getByTestId("test-result-nav-next").click();
  await expect(page.getByTestId("test-result-nav-current")).toHaveText("2/5");
  await expect(page.getByTestId("test-result-info-title")).not.toHaveText("0 sample passed test");
  await page.getByTestId("test-result-prev-next").click();
  await expect(page.getByTestId("test-result-nav-current")).toHaveText("1/5");
  await expect(page.getByTestId("test-result-info-title")).toHaveText("0 sample passed test");
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
