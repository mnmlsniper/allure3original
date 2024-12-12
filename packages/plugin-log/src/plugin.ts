import type { AllureStore, Plugin, PluginContext } from "@allure/plugin-api";
import { gray } from "yoctocolors";
import type { LogPluginOptions } from "./model.js";
import { printSummary, printTest } from "./utils.js";

export class LogPlugin implements Plugin {
  constructor(readonly options: LogPluginOptions = {}) {}

  done = async (context: PluginContext, store: AllureStore) => {
    const { groupBy = "suite" } = this.options ?? {};
    const tests = await store.allTestResults();

    if (groupBy === "none") {
      tests.forEach((test) => {
        printTest(test, this.options);
      });

      console.log("");

      printSummary(Array.from(tests));
      return;
    }

    const groupedTests = await store.testResultsByLabel(groupBy);

    Object.keys(groupedTests).forEach((key) => {
      const tests = groupedTests[key];

      if (tests.length === 0) {
        // skip empty groups
        return;
      }

      if (key === "_") {
        console.info(gray("uncategorized"));
      } else {
        console.info(key);
      }

      tests.forEach((test) => {
        printTest(test, this.options, 1);
      });

      console.log("");
    });

    printSummary(Array.from(tests));
  };
}
