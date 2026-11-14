import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../src/campaign/record/campaign";
import { namedOnLines } from "../../src/references/named-on-lines";

function session(number: number, lines: string[]): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, text: lines.join("\n"), firstLine: 0 };
}

function namedIn(sessions: SessionNote[]) {
  return namedOnLines(buildCampaign(sessions), sessions);
}

describe("namedOnLines", () => {
  it("counts the ? ! and $ lines that name someone, across sessions", () => {
    const sessions = [
      session(1, ["? Who sent [[Lady Vess]] to the mill", "! Find the caravan, from: [[Lady Vess]]"]),
      session(2, ["$ [[Lady Vess]] Silvered lantern"]),
    ];
    expect(namedIn(sessions)).toEqual([{ name: "Lady Vess", lineCount: 3, kind: "character" }]);
  });

  it("does not count a line that is not a ? ! or $ line", () => {
    const sessions = [session(1, ["Tracks lead to the [[Old Mill]].", "[[Mira]] class: wizard", "- [[Old Mill]] is damp", "? Who is at [[Old Mill]]"])];
    expect(namedIn(sessions)).toEqual([{ name: "Old Mill", lineCount: 1, kind: null }]);
  });

  it("does not count a lookup line", () => {
    const sessions = [session(1, ["? Who sent [[Lady Vess]]", "?? [[Lady Vess]]", "!! [[Lady Vess]]", "$$ [[Lady Vess]]"])];
    expect(namedIn(sessions)).toEqual([{ name: "Lady Vess", lineCount: 1, kind: null }]);
  });

  it("counts a line once however often it names the same note", () => {
    const sessions = [session(1, ["? Is [[Mira]] or [[Mira|the elf]] at the mill"])];
    expect(namedIn(sessions)).toEqual([{ name: "Mira", lineCount: 1, kind: null }]);
  });

  it("counts follow-up lines of a question and a quest", () => {
    const sessions = [session(1, ["? Who sent the letter", "?+ Who sent the letter: [[Lady Vess]]", "?= Who sent the letter: [[Lady Vess]]", "! Find the caravan", "!+ Find the caravan: [[Lady Vess]]"])];
    expect(namedIn(sessions)).toEqual([{ name: "Lady Vess", lineCount: 3, kind: null }]);
  });

  it("counts a follow-up that matches no earlier line", () => {
    const sessions = [session(1, ["!x Lost the bridge to [[Baka]]"])];
    expect(namedIn(sessions)).toEqual([{ name: "Baka", lineCount: 1, kind: null }]);
  });

  it("makes a name a place when any line places it, and a character when no line does but one says so", () => {
    const sessions = [
      session(1, ["! Reach the pass, from: [[Grey Pass]]", "? Who guards @[[Grey Pass]]"]),
      session(2, ["! Find the caravan, from: [[Lady Vess]]", "? Who is [[Lady Vess]]"]),
    ];
    expect(namedIn(sessions)).toEqual([
      { name: "Grey Pass", lineCount: 2, kind: "place" },
      { name: "Lady Vess", lineCount: 2, kind: "character" },
    ]);
  });

  it("counts only the sessions it is given", () => {
    const first = session(1, ["? Who is [[Mira]]"]);
    const second = session(2, ["? Where is [[Mira]]"]);
    expect(namedOnLines(buildCampaign([first, second]), [first])).toEqual([{ name: "Mira", lineCount: 1, kind: null }]);
  });
});
