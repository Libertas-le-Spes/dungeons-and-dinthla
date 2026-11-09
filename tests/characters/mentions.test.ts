import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import type { MentionNotes } from "../../src/characters/mention-notes";
import { readMentions } from "../../src/characters/mentions";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const ZERO = "Pale Moon/Sessions/Session 0.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const OLD_TWO = "Ashen Road/Sessions/Session 2.md";
const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const VESS = "Pale Moon/Characters/Vess.md";
const STRAY = "Loose/Sessions/Session 9.md";

interface Linking {
  text: string;
  lines: number[];
}

function notesWith(linking: Record<string, Linking>, order: string[] = Object.keys(linking)): MentionNotes {
  return {
    fileAt: (path) => {
      if (linking[path] === undefined) return null;
      return { path } as TFile;
    },
    textOf: async (file) => linking[file.path]!.text,
    campaignFolders: () => ["Ashen Road", "Pale Moon"],
    onNoteMoved: () => () => {},
    linkingPaths: (target) => {
      if (target !== MIRA.path) return [];
      return order;
    },
    linkedLines: (path) => linking[path]!.lines,
    onLinksResolved: () => () => {},
  };
}

function placesOf(mentions: { source: { path: string; line: number } }[]): string[] {
  return mentions.map(({ source }) => `${source.path}:${source.line}`);
}

describe("readMentions", () => {
  it("reads each linking line without its bullet, with where it is and its session", async () => {
    const mentions = await readMentions(MIRA, notesWith({ [ONE]: { text: "Rain.\n  - Met [[Mira]] at the ford  ", lines: [1] } }));
    expect(mentions).toEqual([{ text: "Met [[Mira]] at the ford", source: { path: ONE, line: 1 }, session: 1 }]);
  });

  it("puts the newest session first, and the last line of each note first", async () => {
    const linking = {
      [ONE]: { text: "[[Mira]]\n[[Mira]]", lines: [0, 1] },
      [TWO]: { text: "a\n[[Mira]]\n[[Mira]]", lines: [1, 2] },
    };
    const mentions = await readMentions(MIRA, notesWith(linking));
    expect(placesOf(mentions)).toEqual([`${TWO}:2`, `${TWO}:1`, `${ONE}:1`, `${ONE}:0`]);
  });

  it("puts other notes after the sessions, by path, whichever order Obsidian gives them in", async () => {
    const linking = {
      [VESS]: { text: "[[Mira]]", lines: [0] },
      [ONE]: { text: "[[Mira]]", lines: [0] },
      [OLD_MILL]: { text: "[[Mira]]", lines: [0] },
    };
    const forwards = await readMentions(MIRA, notesWith(linking, [VESS, ONE, OLD_MILL]));
    const backwards = await readMentions(MIRA, notesWith(linking, [OLD_MILL, ONE, VESS]));
    expect(placesOf(forwards)).toEqual([`${ONE}:0`, `${VESS}:0`, `${OLD_MILL}:0`]);
    expect(placesOf(backwards)).toEqual(placesOf(forwards));
  });

  it("puts Session 0 before other notes, whichever order Obsidian gives them in", async () => {
    const linking = { [ZERO]: { text: "[[Mira]]", lines: [0] }, [OLD_MILL]: { text: "[[Mira]]", lines: [0] } };
    const forwards = await readMentions(MIRA, notesWith(linking, [ZERO, OLD_MILL]));
    const backwards = await readMentions(MIRA, notesWith(linking, [OLD_MILL, ZERO]));
    expect(placesOf(forwards)).toEqual([`${ZERO}:0`, `${OLD_MILL}:0`]);
    expect(placesOf(backwards)).toEqual(placesOf(forwards));
  });

  it("orders sessions with the same number in two campaigns by their campaign", async () => {
    const linking = { [TWO]: { text: "[[Mira]]", lines: [0] }, [OLD_TWO]: { text: "[[Mira]]", lines: [0] } };
    const mentions = await readMentions(MIRA, notesWith(linking, [TWO, OLD_TWO]));
    expect(placesOf(mentions)).toEqual([`${OLD_TWO}:0`, `${TWO}:0`]);
  });

  it("counts a note named like a session outside any campaign as another note", async () => {
    const linking = { [STRAY]: { text: "[[Mira]]", lines: [0] }, [ONE]: { text: "[[Mira]]", lines: [0] } };
    const mentions = await readMentions(MIRA, notesWith(linking, [STRAY, ONE]));
    expect(mentions.map((mention) => mention.session)).toEqual([1, null]);
  });

  it("skips a note that's gone and a line past the end of its note", async () => {
    const notes = notesWith({ [ONE]: { text: "[[Mira]]", lines: [0, 4] } }, [TWO, ONE]);
    expect(placesOf(await readMentions(MIRA, notes))).toEqual([`${ONE}:0`]);
  });

  it("finds nothing when no note links to the character", async () => {
    expect(await readMentions(MIRA, notesWith({}))).toEqual([]);
  });
});
