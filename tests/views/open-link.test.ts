import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile, TFolder } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { Fence } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../src/fence/fenced-metadata";
import { HeldFiles } from "../../src/fence/held-files";
import { refusalForPathParts } from "../../src/fence/safe-path";
import { NO_NAME, NOT_IN_CAMPAIGN, takenAt, UNSAFE_PATH } from "../../src/views/linked-note";
import { MADE_NOTE_CHOICES, type MadeNoteChoice } from "../../src/views/made-note-modal";
import { notMade, openLink } from "../../src/views/open-link";
import { fileAt, folderAt, rawVaultWith } from "../fence/fake-raw-vault";
import { Notice } from "../stubs/obsidian";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const MIRA = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");
const FROM_SESSION = { path: SESSION.path, line: null };

function choiceLabelled(label: string): MadeNoteChoice {
  const choice = MADE_NOTE_CHOICES.find((made) => made.label === label);
  if (choice === undefined) throw new Error(`No choice ${label}.`);
  return choice;
}

const NOTE_CHOICE = choiceLabelled("Note");

function placeWith(linkLeadsTo: TFile | null, files: TFile[] = [SESSION, MIRA, PRIVATE], folders: TFolder[] = []) {
  const { vault, calls } = rawVaultWith(files, folders);
  const raw = { getFirstLinkpathDest: vi.fn(() => linkLeadsTo) };
  const held = new HeldFiles(vault, new Fence(() => "D&D", ".obsidian"));
  const gate = { files: new FencedFiles(vault, held), metadata: new FencedMetadata(raw as unknown as RawMetadata, held) };
  const askFolder = vi.fn(async (_name: string): Promise<MadeNoteChoice | null> => NOTE_CHOICE);
  const leaf = { openFile: vi.fn(async () => {}) };
  const openLinkText = vi.fn(async () => {});
  const app = { workspace: { getLeaf: vi.fn(() => leaf), openLinkText } } as unknown as App;
  const lines = { sessions: { sessionNotes: [] as SessionNote[] }, texts: { read: vi.fn(async (_path: string): Promise<string | null> => null) } };
  return { app, place: { gate, lines, campaignFolders: () => [CAMPAIGN], askFolder }, calls, raw, leaf, openLinkText, getLeaf: app.workspace.getLeaf, askFolder, lines };
}

function openedPaths(leaf: { openFile: ReturnType<typeof vi.fn> }): string[] {
  return leaf.openFile.mock.calls.map(([file]) => (file as TFile).path);
}

beforeEach(() => {
  Notice.shown = [];
});

describe("openLink to a note inside the Campaigns folder", () => {
  it("opens the note the link leads to, making nothing", async () => {
    const { app, place, raw, leaf, calls } = placeWith(MIRA);
    await openLink(app, place, "Mira", FROM_SESSION, false);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note in the tab in use for a plain press", async () => {
    const { app, place, getLeaf } = placeWith(MIRA);
    await openLink(app, place, "Mira", FROM_SESSION, false);
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("opens the note in a new tab when asked", async () => {
    const { app, place, getLeaf, leaf } = placeWith(MIRA);
    await openLink(app, place, "Mira", FROM_SESSION, "tab");
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
  });

  it("opens the note the link leads to in another campaign, as Obsidian resolves it", async () => {
    const elsewhere = fileAt("D&D/Ash Road/Characters/Brannoc.md");
    const { app, place, calls, leaf, askFolder } = placeWith(elsewhere, [SESSION, elsewhere]);
    await openLink(app, place, "Brannoc", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([elsewhere.path]);
    expect(calls.create).not.toHaveBeenCalled();
    expect(askFolder).not.toHaveBeenCalled();
  });

  it("opens the note at the heading the link names", async () => {
    const { app, place, raw, leaf } = placeWith(MIRA);
    await openLink(app, place, "Mira#Background", FROM_SESSION, false);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "#Background" } });
  });
});

describe("openLink to a note that doesn't exist inside the Campaigns folder", () => {
  it("makes the note in the campaign of the note holding the link, then opens it", async () => {
    const { app, place, calls, leaf, openLinkText } = placeWith(null);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
    expect(calls.createFolder).not.toHaveBeenCalled();
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md"]);
    expect(openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note it made in a new tab when asked", async () => {
    const { app, place, getLeaf, leaf } = placeWith(null);
    await openLink(app, place, "Old Mill", FROM_SESSION, "tab");
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md"]);
  });

  it("makes the folders a link names, then the note inside them", async () => {
    const { app, place, calls, leaf } = placeWith(null);
    await openLink(app, place, "Places/Inn", FROM_SESSION, false);
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Places"]]);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Places/Inn.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Places/Inn.md"]);
  });

  it("makes only the folders that are missing", async () => {
    const { app, place, calls } = placeWith(null, [SESSION], [folderAt("D&D/Pale Moon/Places", [])]);
    await openLink(app, place, "Places/Town/Inn", FROM_SESSION, false);
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Places/Town"]]);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Places/Town/Inn.md", "");
  });

  it("leaves out the heading, block and shown name of the link from the new note's name", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill#^cellar|the mill", FROM_SESSION, false);
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Old Mill.md", ""]]);
  });

  it("leaves out the shown name of a link with no heading", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill|the mill", FROM_SESSION, false);
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Old Mill.md", ""]]);
  });

  it("doesn't add a second .md to a link that names it", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill.md", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
  });

  it("makes a note in the campaign, and leaves alone the note outside the Campaigns folder the link leads to", async () => {
    const { app, place, calls, leaf } = placeWith(PRIVATE);
    await openLink(app, place, "Primary", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Primary.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Primary.md"]);
    expect(calls.read).not.toHaveBeenCalled();
  });
});

describe("openLink to a note in the campaign when the link leads outside the Campaigns folder", () => {
  const ROOT_MILL = fileAt("Old Mill.md");

  it("opens the note it made on every later press, making it only once", async () => {
    const files = [SESSION, ROOT_MILL];
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, files);
    calls.create.mockImplementation(async (path: string) => {
      const made = fileAt(path);
      files.push(made);
      return made;
    });
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Old Mill.md", ""]]);
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md", "D&D/Pale Moon/Old Mill.md", "D&D/Pale Moon/Old Mill.md"]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note already at the path the link would make, at the heading it names", async () => {
    const there = fileAt("D&D/Pale Moon/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, there]);
    await openLink(app, place, "Old Mill#Cellar", FROM_SESSION, false);
    expect(leaf.openFile).toHaveBeenCalledWith(there, { eState: { subpath: "#Cellar" } });
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("opens the campaign's note in a new tab when asked", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, getLeaf, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", FROM_SESSION, "tab");
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(openedPaths(leaf)).toEqual([placed.path]);
  });

  it("opens a note of that name in a folder of the campaign, making no second one", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([placed.path]);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("opens the note whose path ends with the folders the link names", async () => {
    const town = fileAt("D&D/Pale Moon/Places/Town/Inn.md");
    const road = fileAt("D&D/Pale Moon/Places/Road/Inn.md");
    const { app, place, leaf } = placeWith(null, [SESSION, road, town]);
    await openLink(app, place, "Town/Inn", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([town.path]);
  });

  it("opens the note at the link's path from the campaign folder before a nearer note that ends the same way", async () => {
    const exact = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const nearer = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, nearer, exact]);
    await openLink(app, place, "Places/Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([exact.path]);
  });

  it("opens the note at the link's path in other capitals before a nearer note that ends the same way", async () => {
    const exact = fileAt("D&D/Pale Moon/places/old mill.md");
    const nearer = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, nearer, exact]);
    await openLink(app, place, "Places/Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([exact.path]);
  });

  it("leaves alone a note in a campaign whose name starts with this one's", async () => {
    const longer = fileAt("D&D/Pale Moonlight/Places/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(null, [SESSION, longer]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md"]);
  });

  it("counts the folders down to a note in its nearness, not only those up from the link", async () => {
    const deeper = fileAt("D&D/Pale Moon/Places/Deep/Old Mill.md");
    const shallower = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, deeper, shallower]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([shallower.path]);
  });

  it("counts the folders up from the link in its nearness, not only those down to a note", async () => {
    const from = { path: "D&D/Pale Moon/Sessions/Arc/Session 1.md", line: null };
    const sameBranch = fileAt("D&D/Pale Moon/Sessions/Zed/Old Mill.md");
    const otherBranch = fileAt("D&D/Pale Moon/Ash/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, sameBranch, otherBranch]);
    await openLink(app, place, "Old Mill", from, false);
    expect(openedPaths(leaf)).toEqual([sameBranch.path]);
  });

  it("opens the note of that name nearest to the note holding the link", async () => {
    const far = fileAt("D&D/Pale Moon/Places/Old/Old Mill.md");
    const near = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, far, near]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([near.path]);
  });

  it("opens the first by path of two notes of that name as near as each other", async () => {
    const road = fileAt("D&D/Pale Moon/Road/Old Mill.md");
    const places = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, road, places]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([places.path]);
  });

  it("opens a note whose name differs from the link only in capitals", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/old mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(openedPaths(leaf)).toEqual([placed.path]);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("leaves alone a note of that name in another campaign, and makes one in this campaign", async () => {
    const other = fileAt("D&D/Ashen Road/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, other]);
    await openLink(app, place, "Old Mill", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md"]);
  });

  it("leaves alone a note whose name only ends with the link's name", async () => {
    const other = fileAt("D&D/Pale Moon/Places/Gold Mill.md");
    const { app, place, calls } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, other]);
    await openLink(app, place, "Mill", FROM_SESSION, false);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Mill.md", "");
  });
});

describe("openLink refusing to make a note", () => {
  async function expectNothingMade(place: ReturnType<typeof placeWith>, linktext: string, sourcePath: string, notice: string) {
    await openLink(place.app, place.place, linktext, { path: sourcePath, line: null }, false);
    expect(place.calls.create).not.toHaveBeenCalled();
    expect(place.calls.createFolder).not.toHaveBeenCalled();
    expect(place.leaf.openFile).not.toHaveBeenCalled();
    expect(place.openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([notice]);
  }

  it("makes nothing for a link that climbs out of the campaign", async () => {
    const refusal = refusalForPathParts("../Private/x");
    expect(refusal).not.toBeNull();
    await expectNothingMade(placeWith(null), "../Private/x", SESSION.path, notMade("../Private/x", String(refusal)));
  });

  it("makes nothing for a link from a note that isn't in a campaign", async () => {
    await expectNothingMade(placeWith(null), "Private/x", PRIVATE.path, notMade("Private/x", NOT_IN_CAMPAIGN));
  });

  it("makes nothing for a link from a note directly in the Campaigns folder", async () => {
    await expectNothingMade(placeWith(null), "Old Mill", "D&D/Loose.md", notMade("Old Mill", NOT_IN_CAMPAIGN));
  });

  it("makes nothing, not even a folder, for a link whose last part a file can't be called", async () => {
    const refusal = refusalForPathParts("Places/Inn.");
    expect(refusal).not.toBeNull();
    await expectNothingMade(placeWith(null), "Places/Inn.", SESSION.path, notMade("Places/Inn.", String(refusal)));
  });

  it("makes nothing for a link written other than as Obsidian writes a path", async () => {
    const decomposed = "Zoe\u0308";
    expect(refusalForPathParts(decomposed)).toBeNull();
    await expectNothingMade(placeWith(null), decomposed, SESSION.path, notMade(decomposed, UNSAFE_PATH));
  });

  it("makes nothing for a link that names no note", async () => {
    await expectNothingMade(placeWith(null), "#Background", SESSION.path, notMade("", NO_NAME));
  });

  it("makes nothing for a link that names no note, even when the campaign holds a note named .md", async () => {
    await expectNothingMade(placeWith(null, [SESSION, fileAt("D&D/Pale Moon/.md")]), "#Background", SESSION.path, notMade("", NO_NAME));
  });

  it("makes nothing where a folder already sits", async () => {
    const folder = folderAt("D&D/Pale Moon/Notes.md", []);
    await expectNothingMade(placeWith(null, [SESSION], [folder]), "Notes.md", SESSION.path, notMade("Notes.md", takenAt(folder.path)));
  });
});

describe("openLink choosing the folder of the note it makes from the line holding the link", () => {
  const FROM_LINE = { path: SESSION.path, line: 1 };

  function placeOnLine(line: string) {
    const place = placeWith(null);
    place.lines.sessions.sessionNotes = [sessionNoteOf(SESSION.path, 1, `We rode on.\n${line}\nRain.`)];
    return place;
  }

  async function madeFrom(line: string, linktext: string) {
    const place = placeOnLine(line);
    await openLink(place.app, place.place, linktext, FROM_LINE, false);
    return place;
  }

  it("makes a note linked on a question line in the campaign's Questions folder", async () => {
    const { calls, leaf, askFolder } = await madeFrom("? Who sent [[Lady Vess]]", "Lady Vess");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Questions/Lady Vess.md", ""]]);
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Questions"]]);
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Questions/Lady Vess.md"]);
    expect(askFolder).not.toHaveBeenCalled();
  });

  it("makes a note linked on an answer line in the Questions folder", async () => {
    const { calls } = await madeFrom("?= [[Lady Vess]] sent it", "Lady Vess");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Questions/Lady Vess.md", "");
  });

  it("makes a note linked on a quest line in the Quests folder, the giver too", async () => {
    const { calls } = await madeFrom("! Find the caravan, from: [[Lady Vess]]", "Lady Vess");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Quests/Lady Vess.md", ""]]);
  });

  it("makes a note linked on a quest's progress line in the Quests folder", async () => {
    const { calls } = await madeFrom("!+ Find the caravan: found [[Old Mill]]", "Old Mill");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Quests/Old Mill.md", "");
  });

  it("makes the holder on a $ line in the Characters folder", async () => {
    const { calls } = await madeFrom("$ [[Old Tom]] Silvered lantern", "Old Tom");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Characters/Old Tom.md", ""]]);
  });

  it("makes any other link on a $ line in the Items folder", async () => {
    const { calls } = await madeFrom("$ [[Old Tom]] [[Silvered lantern]]", "Silvered lantern");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Items/Silvered lantern.md", ""]]);
  });

  it("makes a link on a $ coin line in the Funds folder", async () => {
    const { calls } = await madeFrom("$ -5 gp paid [[Old Tom]] for rooms", "Old Tom");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Funds/Old Tom.md", ""]]);
  });

  it("makes a link marked with @ on a $ coin line in the Funds folder", async () => {
    const { calls } = await madeFrom("$ -5 gp paid [[Old Tom]] for rooms at @[[Old Mill]]", "Old Mill");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Funds/Old Mill.md", ""]]);
  });

  it("makes the buyer on a $$ sale line in the Funds folder", async () => {
    const { calls } = await madeFrom("$$ [[Silvered lantern]] :sold to [[Old Tom]] 30 gp", "Old Tom");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Funds/Old Tom.md", ""]]);
  });

  it("makes the item on a $$ sale line in the Items folder", async () => {
    const { calls } = await madeFrom("$$ [[Silvered lantern]] :sold to [[Old Tom]] 30 gp", "Silvered lantern");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Items/Silvered lantern.md", ""]]);
  });

  it("makes the new holder on a $$ line in the Characters folder", async () => {
    const { calls } = await madeFrom("$$ [[Silvered lantern]] :changed to [[Old Tom]]", "Old Tom");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Characters/Old Tom.md", "");
  });

  it("makes the item on a $$ line in the Items folder", async () => {
    const { calls } = await madeFrom("$$ [[Silvered lantern]] :changed to [[Old Tom]]", "Silvered lantern");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Items/Silvered lantern.md", "");
  });

  it("makes a link marked with @ in the Places folder", async () => {
    const { calls, askFolder } = await madeFrom("We rested at @[[Old Mill]].", "Old Mill");
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Places/Old Mill.md", ""]]);
    expect(askFolder).not.toHaveBeenCalled();
  });

  it("makes a link marked with @ on a question line in the Questions folder", async () => {
    const { calls } = await madeFrom("? Who burned @[[Old Mill]]", "Old Mill");
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Questions/Old Mill.md", "");
  });

  it("puts the link's own folders under the folder it chose", async () => {
    const { calls } = await madeFrom("? Who runs [[Places/Inn]]", "Places/Inn");
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Questions"], ["D&D/Pale Moon/Questions/Places"]]);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Questions/Places/Inn.md", "");
  });

  it("asks what to make a link on a plain line as, and makes it in the folder chosen", async () => {
    const place = placeOnLine("We met [[Old Tom]] at @[[Old Mill]].");
    place.askFolder.mockResolvedValueOnce(choiceLabelled("Character"));
    await openLink(place.app, place.place, "Old Tom", FROM_LINE, false);
    expect(place.askFolder).toHaveBeenCalledExactlyOnceWith("Old Tom");
    expect(place.calls.create.mock.calls).toEqual([["D&D/Pale Moon/Characters/Old Tom.md", ""]]);
    expect(openedPaths(place.leaf)).toEqual(["D&D/Pale Moon/Characters/Old Tom.md"]);
  });

  it("makes nothing, opens nothing and says nothing when the question is cancelled", async () => {
    const place = placeOnLine("We met [[Old Tom]].");
    place.askFolder.mockResolvedValueOnce(null);
    await openLink(place.app, place.place, "Old Tom", FROM_LINE, false);
    expect(place.calls.create).not.toHaveBeenCalled();
    expect(place.calls.createFolder).not.toHaveBeenCalled();
    expect(place.leaf.openFile).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("asks when it doesn't know the line the link sits on", async () => {
    const place = placeOnLine("? Who sent [[Lady Vess]]");
    await openLink(place.app, place.place, "Lady Vess", FROM_SESSION, false);
    expect(place.askFolder).toHaveBeenCalledOnce();
    expect(place.lines.texts.read).not.toHaveBeenCalled();
  });

  it("asks when the line the link sat on is no longer in its note", async () => {
    const place = placeOnLine("? Who sent [[Lady Vess]]");
    await openLink(place.app, place.place, "Lady Vess", { path: SESSION.path, line: 9 }, false);
    expect(place.askFolder).toHaveBeenCalledOnce();
  });

  it("asks when the note that held the link is gone", async () => {
    const place = placeOnLine("? Who sent [[Lady Vess]]");
    await openLink(place.app, place.place, "Lady Vess", { path: "D&D/Pale Moon/Sessions/Session 9.md", line: 1 }, false);
    expect(place.askFolder).toHaveBeenCalledOnce();
  });

  it("refuses a link that climbs out before asking anything", async () => {
    const place = placeOnLine("We met [[../Private/x]].");
    await openLink(place.app, place.place, "../Private/x", FROM_LINE, false);
    expect(place.askFolder).not.toHaveBeenCalled();
    expect(place.calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([notMade("../Private/x", String(refusalForPathParts("../Private/x")))]);
  });

  it("opens a note the link names anywhere in the campaign without asking", async () => {
    const tom = fileAt("D&D/Pale Moon/Characters/Old Tom.md");
    const place = placeWith(null, [SESSION, tom]);
    await openLink(place.app, place.place, "Old Tom", FROM_LINE, false);
    expect(place.askFolder).not.toHaveBeenCalled();
    expect(openedPaths(place.leaf)).toEqual([tom.path]);
  });
});
