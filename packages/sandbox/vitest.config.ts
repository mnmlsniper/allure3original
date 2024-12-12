import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    reporters: [
      "default",
      ["allure-vitest/reporter", { resultsDir: "./allure-results" }],
    ],
  },
});