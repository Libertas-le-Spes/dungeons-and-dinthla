import { describe, expect, it } from "vitest";
import { factsOf, linkedFactsOf } from "../../src/characters/character-facts";

describe("factsOf", () => {
  it("reads name and value pairs between commas", () => {
    expect(factsOf("AC: 15, class: rogue")).toEqual([
      { name: "AC", value: "15" },
      { name: "class", value: "rogue" },
    ]);
  });

  it("keeps a comma that no name follows inside the value", () => {
    expect(factsOf("type: Medium humanoid (human), lawful good, HP: 1,200")).toEqual([
      { name: "type", value: "Medium humanoid (human), lawful good" },
      { name: "HP", value: "1,200" },
    ]);
  });

  it("reads nothing when the text doesn't start with a name and a colon", () => {
    expect(factsOf("grew up on the barges, AC: 15")).toEqual([]);
  });

  it("leaves out a name with no value", () => {
    expect(factsOf("AC:, HP: 12")).toEqual([{ name: "HP", value: "12" }]);
  });
});

describe("linkedFactsOf", () => {
  it("reads the facts after a link at the start of the line", () => {
    expect(linkedFactsOf("- [[Mira|the ranger]] AC: 15")).toEqual({ target: "Mira", facts: [{ name: "AC", value: "15" }] });
  });

  it("reads nothing from a line that doesn't start with a link", () => {
    expect(linkedFactsOf("We met [[Mira]] AC: 15")).toBeNull();
  });
});
