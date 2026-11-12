import { describe, expect, it } from "vitest";
import { paired } from "../../../src/session-notes/renumbering/paired";

describe("paired", () => {
  it("pairs the items of two lists in order", () => {
    expect(paired(["a", "b"], ["x", "y"])).toEqual([
      ["a", "x"],
      ["b", "y"],
    ]);
  });

  it("pairs two empty lists as nothing", () => {
    expect(paired([], [])).toEqual([]);
  });

  it("gives nothing to go on when the first list is longer", () => {
    expect(paired(["a", "b"], ["x"])).toBeNull();
  });

  it("gives nothing to go on when the second list is longer", () => {
    expect(paired(["a"], ["x", "y"])).toBeNull();
  });
});
