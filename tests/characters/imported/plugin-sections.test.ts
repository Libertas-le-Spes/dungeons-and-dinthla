import { describe, expect, it } from "vitest";
import { overrideFacts, type SourcedFact } from "../../../src/characters/reading/sheet-values";
import { pluginSectionLinesOf } from "../../../src/characters/imported/plugin-section-lines";
import { textOf } from "../../imports/builders/line-helpers";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";

function namesOf(facts: readonly SourcedFact[]): string[] {
  const names: string[] = [];
  for (const fact of facts) names.push(fact.name);
  return names;
}

function sorted(lines: Set<number>): number[] {
  return [...lines].sort();
}

describe("the override reader and the import's sections", () => {
  it("does not read a spell's Range: 60 feet, typed in the Spells section, as an override", () => {
    const text = textOf("## Spells (from D&D Beyond)", "- Fire Bolt", "Range: 60 feet", "");
    expect(overrideFacts(text, PATH)).toEqual([]);
  });

  it("reads a fact before the import's sections and one in a section of his own after them", () => {
    const text = textOf("AC: 15", "## Features (from D&D Beyond)", "Speed: 40", "## Notes", "HP: 30");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["AC", "HP"]);
  });

  it("keeps skipping under a smaller heading inside a section", () => {
    const text = textOf("## Inventory (from D&D Beyond)", "### Pack", "Speed: 40", "# Notes", "HP: 30");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["HP"]);
  });

  it("reads a fact under a heading that only looks like one of the import's", () => {
    const text = textOf("## Spells (from D&D Beyond) extra", "Range: 60 feet");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["Range"]);
  });

  it("skips every one of the five sections", () => {
    const text = textOf(
      "## Numbers (from D&D Beyond)", "AC: 1",
      "## Inventory (from D&D Beyond)", "AC: 2",
      "## Purse (from D&D Beyond)", "AC: 3",
      "## Spells (from D&D Beyond)", "AC: 4",
      "## Features (from D&D Beyond)", "AC: 5",
    );
    expect(overrideFacts(text, PATH)).toEqual([]);
  });

  it("marks the heading and the lines of a section, from the body's start, and no line of the properties", () => {
    const lines = ["## Purse (from D&D Beyond)", "- gp · 3", "## Notes", "x"];
    expect(sorted(pluginSectionLinesOf(lines, 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(lines, 1))).toEqual([]);
  });

  it("ends a section at a heading written with up to three spaces before it, or with nothing after its marks", () => {
    expect(sorted(pluginSectionLinesOf(["## Purse (from D&D Beyond)", "a", "   ## Notes", "b"], 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(["## Purse (from D&D Beyond)", "a", "##", "b"], 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(["## Purse (from D&D Beyond)", "a", "    ## Code", "b"], 0))).toEqual([0, 1, 2, 3]);
  });
});
