import { describe, expect, it } from "vitest";
import { choiceOf } from "../../src/views/choice-of";

const DIRECTIONS = ["in", "out"] as const;

describe("choiceOf", () => {
  it("gives back a value that is one of the choices", () => {
    expect(choiceOf(DIRECTIONS, "out")).toBe("out");
  });

  it("gives nothing for a value that isn't one of the choices, even a name every object has", () => {
    expect(choiceOf(DIRECTIONS, "sideways")).toBeUndefined();
    expect(choiceOf(DIRECTIONS, "constructor")).toBeUndefined();
  });
});
