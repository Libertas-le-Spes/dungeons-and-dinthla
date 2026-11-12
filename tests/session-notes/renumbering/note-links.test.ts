import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { NoteLinks } from "../../../src/session-notes/renumbering/note-links";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";

const PALE = "D&D/Pale Moon";
const ASHEN = "D&D/Ashen Road";

function sessionsOf(campaign: string, numbers: number[]): TFile[] {
  return numbers.map((number) => ({ path: `${campaign}/Sessions/Session ${number}.md` }) as TFile);
}

const FILES = {
  getFiles: () => [...sessionsOf(PALE, [1, 2, 4, 5, 6]), ...sessionsOf(ASHEN, [1, 2, 3, 4]), ({ path: `${PALE}/Characters/Mira.md` }) as TFile],
};

function rename(from: number, to: number): SessionRename {
  return { from: `${PALE}/Sessions/Session ${from}.md`, to: `${PALE}/Sessions/Session ${to}.md`, fromNumber: from, toNumber: to };
}

const RENAMES = [rename(4, 3), rename(5, 4), rename(6, 5)];

function linksFrom(notePath: string, campaigns: string[]): NoteLinks {
  return new NoteLinks(notePath, campaigns, FILES, RENAMES);
}

const INSIDE = `${PALE}/Characters/Mira.md`;
const OUTSIDE = "D&D/Ideas.md";

describe("NoteLinks in a note of the campaign", () => {
  it("gives the new name of a link to a session that moves", () => {
    const links = linksFrom(INSIDE, [PALE]);
    expect(links.newTarget("Session 4")).toBe("Session 3");
    expect(links.newTarget("Session 5")).toBe("Session 4");
    expect(links.newTarget("Session 6")).toBe("Session 5");
  });

  it("keeps the folders and the ending the link was written with", () => {
    const links = linksFrom(INSIDE, [PALE]);
    expect(links.newTarget("Sessions/Session 4")).toBe("Sessions/Session 3");
    expect(links.newTarget("Session 4.md")).toBe("Session 3.md");
    expect(links.newTarget("Pale Moon/Sessions/Session 5")).toBe("Pale Moon/Sessions/Session 4");
  });

  it("takes the capitals and spaces around the target as the plugin reads them", () => {
    expect(linksFrom(INSIDE, [PALE]).newTarget(" session 4 ")).toBe("Session 3");
  });

  it("gives nothing for a session that doesn't move, one that is gone and a note that isn't a session", () => {
    const links = linksFrom(INSIDE, [PALE]);
    expect(links.newTarget("Session 1")).toBeNull();
    expect(links.newTarget("Session 3")).toBeNull();
    expect(links.newTarget("Mira")).toBeNull();
    expect(links.newTarget("")).toBeNull();
  });

  it("means its own campaign's session even when another campaign has one of that number", () => {
    const links = linksFrom(INSIDE, [PALE]);
    expect(links.newTarget("Session 4")).toBe("Session 3");
    expect(links.leftAsWritten()).toEqual([]);
  });
});

describe("NoteLinks in a note outside every campaign", () => {
  it("gives the new name of a link that only the renumbered campaign has a session for", () => {
    const links = linksFrom(OUTSIDE, [PALE, ASHEN]);
    expect(links.newTarget("Session 5")).toBe("Session 4");
    expect(links.leftAsWritten()).toEqual([]);
  });

  it("leaves a link two campaigns both have a session for, and says which", () => {
    const links = linksFrom(OUTSIDE, [PALE, ASHEN]);
    expect(links.newTarget("Session 4")).toBeNull();
    expect(links.leftAsWritten()).toEqual(["Session 4"]);
  });

  it("says each link it left once, however often it is asked", () => {
    const links = linksFrom(OUTSIDE, [PALE, ASHEN]);
    links.newTarget("Session 4");
    links.newTarget(" Session 4 ");
    links.newTarget("Session 4");
    expect(links.leftAsWritten()).toEqual(["Session 4"]);
  });

  it("says nothing about a link two campaigns have a session for when neither moves", () => {
    const links = linksFrom(OUTSIDE, [PALE, ASHEN]);
    expect(links.newTarget("Session 2")).toBeNull();
    expect(links.leftAsWritten()).toEqual([]);
  });
});

describe("NoteLinks in a note of another campaign", () => {
  it("gives nothing, since it has no campaign to read a link in", () => {
    const links = linksFrom(`${ASHEN}/Sessions/Session 1.md`, []);
    expect(links.newTarget("Session 5")).toBeNull();
    expect(links.leftAsWritten()).toEqual([]);
  });
});
