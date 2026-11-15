import { describe, expect, it } from "vitest";
import { overrideFacts, type SourcedFact } from "../../../src/characters/reading/sheet-values";
import { pluginSectionLinesOf } from "../../../src/characters/imported/reading/plugin-section-lines";
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
    const text = textOf("## Spells", "- Fire Bolt", "Range: 60 feet", "");
    expect(overrideFacts(text, PATH)).toEqual([]);
  });

  it("reads a fact before the import's sections and one in a section of his own after them", () => {
    const text = textOf("AC: 15", "## Features", "Speed: 40", "## Notes", "HP: 30");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["AC", "HP"]);
  });

  it("keeps skipping under a smaller heading inside a section", () => {
    const text = textOf("## Inventory", "### Pack", "Speed: 40", "# Notes", "HP: 30");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["HP"]);
  });

  it("reads a fact under a heading that only looks like one of the import's", () => {
    const text = textOf("## Spells extra", "Range: 60 feet");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["Range"]);
  });

  it("skips every one of the five sections", () => {
    const text = textOf(
      "## Numbers", "AC: 1",
      "## Inventory", "AC: 2",
      "## Purse", "AC: 3",
      "## Spells", "AC: 4",
      "## Features", "AC: 5",
    );
    expect(overrideFacts(text, PATH)).toEqual([]);
  });

  it("marks the heading and the lines of a section, from the body's start, and no line of the properties", () => {
    const lines = ["## Purse", "- gp · 3", "## Notes", "x"];
    expect(sorted(pluginSectionLinesOf(lines, 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(lines, 1))).toEqual([]);
  });

  it("ends a section at a heading written with up to three spaces before it, or with nothing after its marks", () => {
    expect(sorted(pluginSectionLinesOf(["## Purse", "a", "   ## Notes", "b"], 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(["## Purse", "a", "##", "b"], 0))).toEqual([0, 1]);
    expect(sorted(pluginSectionLinesOf(["## Purse", "a", "    ## Code", "b"], 0))).toEqual([0, 1, 2, 3]);
  });
});

describe("the override reader and the note writer read the same sections", () => {
  it("keeps skipping past a heading inside a percent comment, as the writer does", () => {
    const text = textOf("## Spells", "- Fire Bolt", "%%", "## scratch", "%%", "Range: 60 feet", "");
    expect(overrideFacts(text, PATH)).toEqual([]);
  });

  it("reads a fact after one of the import's headings written inside a fence in his own section", () => {
    const text = textOf("## Notes", "```", "## Features", "```", "HP: 30", "");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["HP"]);
  });

  it("reads a fact after a section the import wrote when the next heading closes it", () => {
    const text = textOf("## Spells", "- Fire Bolt", "## Notes", "HP: 30", "");
    expect(namesOf(overrideFacts(text, PATH))).toEqual(["HP"]);
  });
});

