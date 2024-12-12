import { defineConfig } from "allure";

// TODO: add history path
export default defineConfig({
  name: "Allure Report 3",
  output: "./out/allure-report",
  plugins: {
    awesome: {
      options: {
        reportName: "Allure Report 3",
        singleFile: true,
        reportLanguage: "en",
        open: true,
      },
    },
    log: {
      options: {
        groupBy: "none",
      },
    },
  },
});
