import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BufferResultFile, PathResultFile } from "../src/index.js";

describe("BufferResultFile", () => {
  it("should detect png content type", async () => {
    const buffer = Buffer.from("dummy buffer");
    const resultFile = new BufferResultFile(buffer, `${randomUUID()}-attachment.png`);

    expect(resultFile.getContentType()).toEqual("image/png");
  });
});

describe("PathResultFile", () => {
  it("dummy test", () => {
    const resultFile = new PathResultFile("dummy path");

    expect(resultFile).toBeInstanceOf(PathResultFile);
  });
});
