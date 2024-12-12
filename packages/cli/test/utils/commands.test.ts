import { cac } from "cac";
import { describe, expect, it } from "vitest";
import { createCommand } from "../../src/utils/commands.js";

describe("createCommand", () => {
  it("throws when command is not provided", () => {
    const cli = cac();

    expect(() =>
      // @ts-ignore
      createCommand({
        action: () => Promise.resolve(),
      }),
    ).toThrowError("Command name is not provided!");
  });

  it("throws when action is falsy", () => {
    const cli = cac();

    expect(() =>
      // @ts-ignore
      createCommand({
        name: "foo",
      }),
    ).toThrowError("Command action is not provided!");
  });

  it("adds command without options", () => {
    const cli = cac();
    const command = createCommand({
      name: "foo",
      action: () => Promise.resolve(),
    });

    command(cli);

    expect(cli.commands).toHaveLength(1);
    expect(cli.commands[0].name).toBe("foo");
  });

  it("adds command with options", () => {
    const cli = cac();
    const command = createCommand({
      name: "foo",
      options: [
        ["-b, --bar"],
        ["--baz", { description: "baz option" }],
        ["--beep", { description: "beep option", default: "boop" }],
      ],
      action: () => Promise.resolve(),
    });

    command(cli);

    expect(cli.commands).toHaveLength(1);
    expect(cli.commands[0].name).toBe("foo");
    expect(cli.commands[0].options).toHaveLength(3);
    expect(cli.commands[0].options).toContainEqual(
      expect.objectContaining({
        name: "bar",
      }),
    );
    expect(cli.commands[0].options).toContainEqual(
      expect.objectContaining({
        name: "baz",
        description: "baz option",
      }),
    );
    expect(cli.commands[0].options).toContainEqual(
      expect.objectContaining({
        name: "beep",
        description: "beep option",
        config: {
          default: "boop",
        },
      }),
    );
  });
});
