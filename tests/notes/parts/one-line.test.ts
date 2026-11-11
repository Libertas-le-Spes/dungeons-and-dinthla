import { describe, expect, it } from "vitest";
import { oneLine } from "../../../src/notes/parts/one-line";

describe("oneLine", () => {
  it("joins lines and runs of spaces into single spaces, trimmed", () => {
    expect(oneLine("  tracks\n lead\t\tto  the mill ")).toBe("tracks lead to the mill");
    expect(oneLine(" \n ")).toBe("");
  });
});
