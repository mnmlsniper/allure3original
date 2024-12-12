# Allure 3

> Allure Report is a flexible multi-language test report tool to show you a detailed representation of what has been tested and extract maximum from the everyday execution of tests.

[<img src="https://allurereport.org/public/img/allure-report.svg" height="85px" alt="Allure Report logo" align="right" />](https://allurereport.org "Allure Report")

- Learn more about Allure Report at https://allurereport.org
- 📚 [Documentation](https://allurereport.org/docs/) – discover official documentation for Allure Report
- ❓ [Questions and Support](https://github.com/orgs/allure-framework/discussions/categories/questions-support) – get help from the team and community
- 📢 [Official annoucements](https://github.com/orgs/allure-framework/discussions/categories/announcements) – be in touch with the latest updates
- 💬 [General Discussion ](https://github.com/orgs/allure-framework/discussions/categories/general-discussion) – engage in casual conversations, share insights and ideas with the community

---

## Before you start

Allure Report 3.0 is still in active development and this is the first public version, 
and this is far from everything we plan to launch.

We're following high quality standards, but some features may be changed or removed in 
the release version.

## Installation

Use your favorite package manager to install Allure Report:

```shell
npm add allure
yarn add allure
pnpm add allure
```

## Usage

Allure Report utilizes an `allurerc.js` runtime configuration file which provides an 
ability to customize your workflow.

```js
import { defineConfig } from "allure";

export default defineConfig({
  name: "Allure Report",
  output: "./allure-report",
  historyPath: "./history.jsonl",
  plugins: {
    "allure-awesome": {
      options: {
        reportName: "HelloWorld",
        singleFile: true,
        reportLanguage: "en",
        open: true,
      },
    },
  },
});
```

## Plugins

You can combine multiple plugins in your configuration file at once.

Every plugin has its own set of options, consult the documentation for more details.

### Reports

- [Allure Awesome](./packages/plugin-awesome/README.md) – a brand new HTML report with 
modern interface and new features
- [Allure Classic](./packages/plugin-classic/README.md) – a classic view of Allure Report
- [CSV](./packages/plugin-csv/README.md) – CSV report
- [Log](./packages/plugin-log/README.md) – print report to the console
- [Progress](./packages/plugin-progress/README.md) – print report to the console in real-time

### Notifications

- [Slack](./packages/plugin-slack/README.md) – send report to the Slack

### Utilities

- [Test Plan](./packages/plugin-testplan/README.md) – test plan support
