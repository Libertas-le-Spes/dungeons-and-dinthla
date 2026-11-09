import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import type { MentionNotes } from "../../src/characters/mention-notes";
import { readMentions } from "../../src/characters/mentions";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const LOOSE_MIRA = { path: "Loose/Mira.md", basename: "Mira" } as TFile;
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const TWELVE = "Pale Moon/Sessions/Session 12.md";
const PADDED_TWO = "Pale Moon/Sessions/Session 02.md";
const OLD_TWO = "Ashen Road/Sessions/Session 2.md";
const OLD_TWELVE = "Ashen Road/Sessions/Session 12.md";
const BRIGHT_ONE = "Bright Sea/Sessions/Session 1.md";
const BRIGHT_TWELVE = "Bright Sea/Sessions/Session 12.md";
const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const STRAY = "Loose/Sessions/Session 9.md";

interface Linking {
  text: string;
  lines: number[];
}

function notesWith(linking: Record<string, Linking>, order: string[] = Object.keys(linking), campaignFolders = ["Ashen Road", "Bright Sea", "Pale Moon"]): MentionNotes {
  return {
    fileAt: (path) => {
      if (linking[path] === undefined) return null;
      return { path } as TFile;
    },
    textOf: async (file) => linking[file.path]!.text,
    campaignFolders: () => campaignFolders,
    onNoteMoved: () => () => {},
    linkingPaths: (target) => {
      if (target !== MIRA.path && target !== LOOSE_MIRA.path) return [];
      return order;
    },
    linkedLines: (path) => linking[path]!.lines,
    onLinksResolved: () => () => {},
  };
}

function placesOf(mentions: { source: { path: string; line: number } }[]): string[] {
  return mentions.map(({ source }) => `${source.path}:${source.line}`);
}

const once = (text = "[[Mira]]") => ({ text, lines: [0] });

describe("readMentions", () => {
  it("reads each linking session line without its bullet, with where it is", async () => {
    const mentions = await readMentions(MIRA, notesWith({ [ONE]: { text: "Rain.\n  - Met [[Mira]] at the ford  ", lines: [1] } }));
    expect(mentions).toEqual([{ text: "Met [[Mira]] at the ford", source: { path: ONE, line: 1 }, where: "Session 1" }]);
  });

  it("lists session lines only, from every campaign, not lines in other notes", async () => {
    const linking = { [OLD_MILL]: once(), [STRAY]: once(), [ONE]: once(), [OLD_TWO]: once() };
    expect(placesOf(await readMentions(MIRA, notesWith(linking)))).toEqual([`${ONE}:0`, `${OLD_TWO}:0`]);
  });

  it("puts the newest session first, and the last line of each session first", async () => {
    const linking = {
      [ONE]: { text: "[[Mira]]\n[[Mira]]", lines: [0, 1] },
      [TWO]: { text: "a\n[[Mira]]\n[[Mira]]", lines: [1, 2] },
    };
    const mentions = await readMentions(MIRA, notesWith(linking));
    expect(placesOf(mentions)).toEqual([`${TWO}:2`, `${TWO}:1`, `${ONE}:1`, `${ONE}:0`]);
  });

  it("keeps each campaign's sessions together, the character's own campaign first, then the others by name", async () => {
    const linking = { [OLD_TWELVE]: once(), [ONE]: once(), [BRIGHT_ONE]: once(), [TWELVE]: once(), [OLD_TWO]: once() };
    const forwards = await readMentions(MIRA, notesWith(linking));
    const backwards = await readMentions(MIRA, notesWith(linking, Object.keys(linking).reverse()));
    expect(placesOf(forwards)).toEqual([`${TWELVE}:0`, `${ONE}:0`, `${OLD_TWELVE}:0`, `${OLD_TWO}:0`, `${BRIGHT_ONE}:0`]);
    expect(placesOf(backwards)).toEqual(placesOf(forwards));
  });

  it("orders campaigns by name for a character outside any campaign", async () => {
    const linking = { [ONE]: once(), [BRIGHT_TWELVE]: once(), [OLD_TWO]: once() };
    const mentions = await readMentions(LOOSE_MIRA, notesWith(linking));
    expect(placesOf(mentions)).toEqual([`${OLD_TWO}:0`, `${BRIGHT_TWELVE}:0`, `${ONE}:0`]);
  });

  it("names the campaign of a session outside the character's own", async () => {
    const mentions = await readMentions(MIRA, notesWith({ [ONE]: once(), [OLD_TWO]: once() }));
    expect(mentions.map((mention) => mention.where)).toEqual(["Session 1", "Session 2 · Ashen Road"]);
  });

  it("names another campaign by its name, not the path of its folder in the Campaigns folder", async () => {
    const mira = { path: "D&D/Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
    const linking = { "D&D/Ashen Road/Sessions/Session 3.md": once() };
    const notes = { ...notesWith(linking, Object.keys(linking), ["D&D/Ashen Road", "D&D/Pale Moon"]), linkingPaths: () => Object.keys(linking) };
    const mentions = await readMentions(mira, notes);
    expect(mentions.map((mention) => mention.where)).toEqual(["Session 3 · Ashen Road"]);
  });

  it("keeps two notes with the same session number apart, by path", async () => {
    const linking = { [TWO]: { text: "[[Mira]]\n[[Mira]]", lines: [0, 1] }, [PADDED_TWO]: { text: "a\n[[Mira]]", lines: [1] } };
    const forwards = await readMentions(MIRA, notesWith(linking));
    const backwards = await readMentions(MIRA, notesWith(linking, [PADDED_TWO, TWO]));
    expect(placesOf(forwards)).toEqual([`${PADDED_TWO}:1`, `${TWO}:1`, `${TWO}:0`]);
    expect(placesOf(backwards)).toEqual(placesOf(forwards));
  });

  it("skips a session that's gone and a line past the end of its session", async () => {
    const notes = notesWith({ [ONE]: { text: "[[Mira]]", lines: [0, 4] } }, [TWO, ONE]);
    expect(placesOf(await readMentions(MIRA, notes))).toEqual([`${ONE}:0`]);
  });

  it("finds nothing when no session links to the character", async () => {
    expect(await readMentions(MIRA, notesWith({}))).toEqual([]);
  });
});
