import {
  AllureStore,
  KnownTestFailure,
  QualityGateConfig,
  QualityGateLabelsRulesMeta,
  TestCase,
  TestResult,
} from "@allurereport/core-api";
import { describe, expect, it } from "vitest";
import {
  AbstractQualityGateValidator,
  MaxFailuresValidator,
  MinTestsCountValidator,
  QualityGate,
  SuccessRateValidator,
} from "../src/qualityGate.js";

const fixtures = {
  trs: {
    passed: {
      name: "passed test result",
      status: "passed",
      labels: [],
    },
    failed: {
      name: "failed test result",
      status: "failed",
      labels: [],
    },
    broken: {
      name: "broken test result",
      status: "broken",
      labels: [],
    },
  } as Record<string, Partial<TestResult>>,
  trsMeta: {
    feature: {
      labels: [{ name: "feature", value: "example" }],
    },
  },
  rulesMeta: {
    labels: {
      type: "label",
      name: "feature",
      value: "example",
    } as QualityGateLabelsRulesMeta,
  },
  known: [
    {
      historyId: "foobarbaz",
    },
  ] as KnownTestFailure[],
};

describe("MaxFailuresValidator", () => {
  describe("without meta", () => {
    it("fails when there are more failures than allowed", async () => {
      const validator = new MaxFailuresValidator(0);
      const store = {
        allTestResults: async () => [fixtures.trs.failed, fixtures.trs.passed],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 0,
        actual: 1,
      });
    });

    it("passes when there are less failures than allowed", async () => {
      const validator = new MaxFailuresValidator(0);
      const store = {
        allTestResults: async () => [fixtures.trs.passed],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0,
        actual: 0,
      });
    });
  });

  describe("with meta", () => {
    it("fails when there are more failures than allowed", async () => {
      const validator = new MaxFailuresValidator(0, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
        ],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 0,
        actual: 1,
      });
    });

    it("passes when there are less failures than allowed", async () => {
      const validator = new MaxFailuresValidator(0, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0,
        actual: 0,
      });
    });

    it("passes when there are failed, but not matched tests", async () => {
      const validator = new MaxFailuresValidator(0, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [fixtures.trs.failed],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0,
        actual: 0,
      });
    });
  });
});

describe("MinTestsCountValidator", () => {
  describe("without meta", () => {
    it("fails when there are not enough tests", async () => {
      const validator = new MinTestsCountValidator(2);
      const store = {
        allTestResults: async () => [fixtures.trs.passed],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 2,
        actual: 1,
      });
    });

    it("passes when there are enough tests", async () => {
      const validator = new MinTestsCountValidator(2);
      const store = {
        allTestResults: async () => [fixtures.trs.passed, fixtures.trs.passed],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 2,
        actual: 2,
      });
    });
  });

  describe("with meta", () => {
    it("fails when there are not enough tests", async () => {
      const validator = new MinTestsCountValidator(2, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 2,
        actual: 1,
      });
    });

    it("passes when there are enough tests", async () => {
      const validator = new MinTestsCountValidator(1, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 1,
        actual: 1,
      });
    });

    it("passed when there are enough tests matched to the given meta", async () => {
      const validator = new MinTestsCountValidator(1, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          fixtures.trs.passed,
          fixtures.trs.passed,
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 1,
        actual: 1,
      });
    });
  });
});

describe("SuccessRateValidator", () => {
  describe("without meta", () => {
    it("fails when success rate is less than the limit", async () => {
      const validator = new SuccessRateValidator(0.5);
      const store = {
        allTestResults: async () => [
          fixtures.trs.failed,
          fixtures.trs.failed,
          fixtures.trs.failed,
          fixtures.trs.passed,
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 0.5,
        actual: 0.25,
      });
    });

    it("passed when success rate is more or equal to the limit", async () => {
      const validator = new SuccessRateValidator(0.5);
      const store = {
        allTestResults: async () => [
          fixtures.trs.failed,
          fixtures.trs.passed,
          fixtures.trs.passed,
          fixtures.trs.passed,
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0.5,
        actual: 0.75,
      });
    });

    it("excludes known issues from the test results pull", async () => {
      const validator = new SuccessRateValidator(0.5);
      const store = {
        allTestResults: async () => [
          {
            ...fixtures.trs.failed,
            historyId: fixtures.known[0].historyId,
          },
          fixtures.trs.failed,
          fixtures.trs.passed,
          fixtures.trs.passed,
          fixtures.trs.passed,
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0.5,
        actual: 0.75,
      });
    });
  });

  describe("with meta", () => {
    it("fails when success rate is less than the limit", async () => {
      const validator = new SuccessRateValidator(0.5, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          fixtures.trs.failed,
          fixtures.trs.passed,
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: false,
        expected: 0.5,
        actual: 0.25,
      });
    });

    it("passed when success rate is more or equal to the limit", async () => {
      const validator = new SuccessRateValidator(0.5, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          fixtures.trs.failed,
          fixtures.trs.passed,
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0.5,
        actual: 0.75,
      });
    });

    it("excludes known issues from the test results pull", async () => {
      const validator = new SuccessRateValidator(0.5, fixtures.rulesMeta.labels);
      const store = {
        allTestResults: async () => [
          fixtures.trs.failed,
          fixtures.trs.passed,
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
            historyId: fixtures.known[0].historyId,
          },
          {
            ...fixtures.trs.failed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
          {
            ...fixtures.trs.passed,
            ...fixtures.trsMeta.feature,
          },
        ],
        allKnownIssues: async () => fixtures.known,
      } as AllureStore;
      const result = await validator.validate(store);

      expect(result).toMatchObject({
        success: true,
        expected: 0.5,
        actual: 0.75,
      });
    });
  });
});

describe("QualityGate", () => {
  it("executes all validators for root rules", async () => {
    const config: QualityGateConfig = {
      rules: {
        minTestsCount: 5,
        maxFailures: 5,
        successRate: 0.5,
      },
    };
    const gate = new QualityGate(config);
    const store = {
      allTestResults: async () => [fixtures.trs.passed, fixtures.trs.failed, fixtures.trs.failed, fixtures.trs.failed],
      allTestCases: async () => [] as TestCase[],
      allKnownIssues: async () => fixtures.known,
    } as AllureStore;

    await gate.validate(store);

    expect(gate.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actual: 4,
          expected: 5,
          meta: undefined,
          rule: "minTestsCount",
          success: false,
        }),
        expect.objectContaining({
          actual: 3,
          expected: 5,
          meta: undefined,
          rule: "maxFailures",
          success: true,
        }),
        expect.objectContaining({
          actual: 0.25,
          expected: 0.5,
          meta: undefined,
          rule: "successRate",
          success: false,
        }),
      ]),
    );
  });

  it("executes all validators for enforced rules", async () => {
    const config: QualityGateConfig = {
      enforce: [
        {
          type: "label",
          name: "feature",
          value: "example",
          rules: {
            minTestsCount: 5,
            maxFailures: 5,
            successRate: 0.5,
          },
        },
      ],
    };
    const gate = new QualityGate(config);
    const store = {
      allTestResults: async () => [
        {
          ...fixtures.trs.passed,
          labels: [{ name: "feature", value: "example" }],
        },
        {
          ...fixtures.trs.failed,
          labels: [{ name: "feature", value: "example" }],
        },
        {
          ...fixtures.trs.failed,
          labels: [{ name: "feature", value: "example" }],
        },
        {
          ...fixtures.trs.failed,
          labels: [{ name: "feature", value: "example" }],
        },
      ],
      allTestCases: async () => [] as TestCase[],
      allKnownIssues: async () => fixtures.known,
    } as AllureStore;

    await gate.validate(store);

    expect(gate.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actual: 4,
          expected: 5,
          meta: {
            type: "label",
            name: "feature",
            value: "example",
          },
          rule: "minTestsCount",
          success: false,
        }),
        expect.objectContaining({
          actual: 3,
          expected: 5,
          meta: {
            type: "label",
            name: "feature",
            value: "example",
          },
          rule: "maxFailures",
          success: true,
        }),
        expect.objectContaining({
          actual: 0.25,
          expected: 0.5,
          meta: {
            type: "label",
            name: "feature",
            value: "example",
          },
          rule: "successRate",
          success: false,
        }),
      ]),
    );
  });

  it("allows to define custom validators", async () => {
    class MaxHiddenTestsValidator extends AbstractQualityGateValidator {
      async validate(store: AllureStore) {
        const allTrs = await store.allTestResults();
        const invalidTrs = allTrs.filter((tr) => tr.hidden);

        return {
          success: invalidTrs.length <= this.limit,
          rule: "maxHiddenTests",
          meta: this.meta,
          expected: this.limit,
          actual: invalidTrs.length,
        };
      }
    }

    const config: QualityGateConfig = {
      rules: {
        maxHiddenTests: 1,
      },
      validators: {
        maxHiddenTests: MaxHiddenTestsValidator,
      },
    };
    const gate = new QualityGate(config);
    const store = {
      allTestResults: async () => [
        {
          ...fixtures.trs.passed,
          hidden: true,
        },
        {
          ...fixtures.trs.passed,
          hidden: true,
        },
      ],
    } as AllureStore;

    await gate.validate(store);

    expect(gate.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          success: false,
          rule: "maxHiddenTests",
          expected: 1,
          actual: 2,
        }),
      ]),
    );
  });

  it("returns exit code 0 when all rules are passed", async () => {
    const config: QualityGateConfig = {
      rules: {
        maxFailures: 0,
      },
    };
    const gate = new QualityGate(config);
    const store = {
      allTestResults: async () => [fixtures.trs.passed],
    } as AllureStore;

    await gate.validate(store);

    expect(gate.exitCode).toBe(0);
  });

  it("returns exit code 1 when at least one rule is failed", async () => {
    const config: QualityGateConfig = {
      rules: {
        maxFailures: 0,
      },
    };
    const gate = new QualityGate(config);
    const store = {
      allTestResults: async () => [fixtures.trs.failed],
    } as AllureStore;

    await gate.validate(store);

    expect(gate.exitCode).toBe(1);
  });
});
