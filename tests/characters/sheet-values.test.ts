import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../src/campaign/campaign";
import { learnedFacts, modifierOf, overrideFacts, sheetValuesOf } from "../../src/characters/sheet-values";

function session(number: number, lines: string[]): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, firstLine: 0, text: lines.join("\n") };
}

const isMira = (target: string) => target === "Mira";

describe("learnedFacts", () => {
  it("reads the character's fact lines in session order, whatever order the notes come in", () => {
    const sessions = [session(2, ["[[Mira]] HP: 30"]), session(1, ["We meet [[Mira]].", "[[Mira]] HP: 20, AC: 15"])];
    expect(learnedFacts(sessions, isMira)).toEqual([
      { name: "HP", value: "20" },
      { name: "AC", value: "15" },
      { name: "HP", value: "30" },
    ]);
  });

  it("leaves out the fact lines of other characters", () => {
    expect(learnedFacts([session(1, ["[[Vess]] AC: 12", "[[Mira]] AC: 15"])], isMira)).toEqual([{ name: "AC", value: "15" }]);
  });

  it("passes the session the line is in when matching the link", () => {
    const paths: string[] = [];
    learnedFacts([session(3, ["[[Mira]] AC: 15"])], (_target, sourcePath) => paths.push(sourcePath) > 0);
    expect(paths).toEqual(["Pale Moon/Sessions/Session 3.md"]);
  });
});

describe("overrideFacts", () => {
  it("reads facts at the start of the character's own lines, after its properties", () => {
    const note = ["---", "class: wizard", "---", "AC: 16", "- speed: 30 ft.", "She knows every ferry."].join("\n");
    expect(overrideFacts(note)).toEqual([
      { name: "AC", value: "16" },
      { name: "speed", value: "30 ft." },
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
