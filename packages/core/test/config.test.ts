import { MockInstance, beforeEach, describe, expect, it, vi } from "vitest";
import { defineConfig, getPluginId, resolvePlugin } from "../src/config.js";
import { importWrapper } from "../src/utils/module.js";

vi.mock("../src/utils/module.js", () => ({
  importWrapper: vi.fn(),
}));

describe("getPluginId", () => {
  it("cuts off npm package scope and returns the rest part", () => {
    expect(getPluginId("@allure/classic")).toEqual("classic");
  });

  it("returns the same string if it doesn't have scope", () => {
    expect(getPluginId("classic")).toEqual("classic");
  });

  it("replaces slashes with dashes", () => {
    expect(getPluginId("allure/plugin/foo")).toEqual("allure-plugin-foo");
    expect(getPluginId("allure\\plugin\\foo")).toEqual("allure-plugin-foo");
  });
});

describe("resolvePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepends @allure/plugin- prefix and tries to resolve plugin when the path is not scoped", async () => {
    const fixture = { name: "Allure" };

    (importWrapper as unknown as MockInstance).mockImplementation((path: string) => {
      if (path.startsWith("@allure")) {
        throw new Error("not found");
      }

      return { default: fixture };
    });

    const plugin = await resolvePlugin("classic");

    expect(importWrapper).toHaveBeenCalledTimes(2);
    expect(importWrapper).toHaveBeenCalledWith("@allure/plugin-classic");
    expect(importWrapper).toHaveBeenCalledWith("classic");
    expect(plugin).toEqual(fixture);
  });

  it("throws an error when plugin can't be resolved", async () => {
    (importWrapper as unknown as MockInstance).mockRejectedValue(new Error("an error"));

    expect(() => resolvePlugin("classic")).rejects.toThrow("Cannot resolve plugin: classic");
  });
});

describe("defineConfig", () => {
  it("returns config which includes plugins descriptors with normalized id and the plugin instance", async () => {
    class Plugin {}

    (importWrapper as unknown as MockInstance).mockImplementation((path: string) => {
      return { default: Plugin };
    });

    const result = await defineConfig({
      name: "foo",
      output: "bar",
      plugins: {
        "allure/plugin-foo": {
          import: "classic",
          options: {},
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        name: "foo",
        output: "bar",
        plugins: {
          "allure/plugin-foo": {
            import: "classic",
            options: {},
          },
        },
      }),
    );
  });
});
