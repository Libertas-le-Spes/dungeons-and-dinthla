import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../src/campaign/campaign";
import { factsByCharacter, isSheetName, modifierOf, overrideFacts, sheetValuesOf } from "../../src/characters/sheet-values";

function session(number: number, lines: string[], firstLine = 0): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, firstLine, text: lines.join("\n") };
}

function pathOfLink(linktext: string): string | null {
  if (linktext === "Nobody") return null;
  return `Pale Moon/Characters/${linktext}.md`;
}

const MIRA = "Pale Moon/Characters/Mira.md";

describe("factsByCharacter", () => {
  it("reads each character's fact lines in session order, whatever order the notes come in, with where each was written", () => {
    const sessions = [session(2, ["[[Mira]] HP: 30"]), session(1, ["We meet [[Mira]].", "[[Mira]] HP: 20, AC: 15"])];
    expect(factsByCharacter(sessions, pathOfLink).get(MIRA)).toEqual([
      { name: "HP", value: "20", source: { path: "Pale Moon/Sessions/Session 1.md", line: 1 } },
      { name: "AC", value: "15", source: { path: "Pale Moon/Sessions/Session 1.md", line: 1 } },
      { name: "HP", value: "30", source: { path: "Pale Moon/Sessions/Session 2.md", line: 0 } },
    ]);
  });

  it("groups the facts by the note each link points to, leaving out links to no note", () => {
    const facts = factsByCharacter([session(1, ["[[Vess]] AC: 12", "[[Mira]] AC: 15", "[[Nobody]] AC: 9", "[[Mira]] HP: 4"])], pathOfLink);
    expect([...facts].map(([path, sourced]) => [path, sourced.map(({ value }) => value)])).toEqual([
      ["Pale Moon/Characters/Vess.md", ["12"]],
      [MIRA, ["15", "4"]],
    ]);
  });

  it("matches each link from the session it is in", () => {
    const paths: string[] = [];
    factsByCharacter([session(3, ["[[Mira]] AC: 15"])], (_linktext, sourcePath) => {
      paths.push(sourcePath);
      return null;
    });
    expect(paths).toEqual(["Pale Moon/Sessions/Session 3.md"]);
  });

  it("skips a session's properties", () => {
    const sessions = [session(1, ["---", "[[Mira]] AC: 9", "---", "[[Mira]] AC: 15"], 3)];
    expect(factsByCharacter(sessions, pathOfLink).get(MIRA)!.map(({ value }) => value)).toEqual(["15"]);
  });
});

describe("overrideFacts", () => {
  it("reads facts at the start of the character's own lines, after its properties, with their lines", () => {
    const note = ["---", "class: wizard", "---", "AC: 16", "- speed: 30 ft.", "She knows every ferry."].join("\n");
    expect(overrideFacts(note, MIRA)).toEqual([
      { name: "AC", value: "16", source: { path: MIRA, line: 3 } },
      { name: "speed", value: "30 ft.", source: { path: MIRA, line: 4 } },
    ]);
  });
});

describe("sheetValuesOf", () => {
  it("keeps the newest value, lets the character's own note override, and matches names whatever their capitals", () => {
    const values = sheetValuesOf(
      [
        { name: "Hp", value: "20" },
        { name: "hp", value: "30" },
        { name: "ac", value: "15" },
        { name: "eyes", value: "grey" },
      ],
      [{ name: "AC", value: "16" }],
    );
    expect([...values]).toEqual([
      ["HP", "30"],
      ["AC", "16"],
      ["eyes", "grey"],
    ]);
  });
});

describe("modifierOf", () => {
  it("works out a modifier from a score", () => {
    expect([modifierOf("18"), modifierOf("10"), modifierOf("11"), modifierOf("9"), modifierOf(" 3 ")]).toEqual(["+4", "+0", "+0", "−1", "−4"]);
  });

  it("gives no modifier for a score that isn't a whole number", () => {
    expect([modifierOf("15 (heroic)"), modifierOf("high")]).toEqual(["", ""]);
  });
});

describe("isSheetName", () => {
  it("knows the sheet's own names whatever their capitals, and no others", () => {
    expect(isSheetName("ac")).toBe(true);
    expect(isSheetName("Speed")).toBe(true);
    expect(isSheetName("Personality")).toBe(false);
  });
});
