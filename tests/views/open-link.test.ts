import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile, TFolder } from "obsidian";
import { Fence } from "../../src/fence/fence";
import { FencedFiles } from "../../src/fence/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../src/fence/fenced-metadata";
import { HeldFiles } from "../../src/fence/held-files";
import { refusalForPathParts } from "../../src/fence/safe-path";
import { NO_NAME, NOT_IN_CAMPAIGN, takenAt, UNSAFE_PATH } from "../../src/views/linked-note";
import { notMade, openLink } from "../../src/views/open-link";
import { fileAt, folderAt, rawVaultWith } from "../fence/fake-raw-vault";
import { Notice } from "../stubs/obsidian";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const MIRA = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");

function placeWith(linkLeadsTo: TFile | null, files: TFile[] = [SESSION, MIRA, PRIVATE], folders: TFolder[] = []) {
  const { vault, calls } = rawVaultWith(files, folders);
  const raw = { getFirstLinkpathDest: vi.fn(() => linkLeadsTo) };
  const held = new HeldFiles(vault, new Fence(() => "D&D", ".obsidian"));
  const gate = { files: new FencedFiles(vault, held), metadata: new FencedMetadata(raw as unknown as RawMetadata, held) };
  const leaf = { openFile: vi.fn(async () => {}) };
  const openLinkText = vi.fn(async () => {});
  const app = { workspace: { getLeaf: vi.fn(() => leaf), openLinkText } } as unknown as App;
  return { app, place: { gate, campaignFolders: () => [CAMPAIGN] }, calls, raw, leaf, openLinkText };
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
    await openLink(app, place, "Mira", SESSION.path);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note at the heading the link names", async () => {
    const { app, place, raw, leaf } = placeWith(MIRA);
    await openLink(app, place, "Mira#Background", SESSION.path);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "#Background" } });
  });
});

describe("openLink to a note that doesn't exist inside the Campaigns folder", () => {
  it("makes the note in the campaign of the note holding the link, then opens it", async () => {
    const { app, place, calls, leaf, openLinkText } = placeWith(null);
    await openLink(app, place, "Old Mill", SESSION.path);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
    expect(calls.createFolder).not.toHaveBeenCalled();
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Old Mill.md"]);
    expect(openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("makes the folders a link names, then the note inside them", async () => {
    const { app, place, calls, leaf } = placeWith(null);
    await openLink(app, place, "Places/Inn", SESSION.path);
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Places"]]);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Places/Inn.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Places/Inn.md"]);
  });

  it("makes only the folders that are missing", async () => {
    const { app, place, calls } = placeWith(null, [SESSION], [folderAt("D&D/Pale Moon/Places", [])]);
    await openLink(app, place, "Places/Town/Inn", SESSION.path);
    expect(calls.createFolder.mock.calls).toEqual([["D&D/Pale Moon/Places/Town"]]);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Places/Town/Inn.md", "");
  });

  it("leaves out the heading, block and shown name of the link from the new note's name", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill#^cellar|the mill", SESSION.path);
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Old Mill.md", ""]]);
  });

  it("leaves out the shown name of a link with no heading", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill|the mill", SESSION.path);
    expect(calls.create.mock.calls).toEqual([["D&D/Pale Moon/Old Mill.md", ""]]);
  });

  it("doesn't add a second .md to a link that names it", async () => {
    const { app, place, calls } = placeWith(null);
    await openLink(app, place, "Old Mill.md", SESSION.path);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Old Mill.md", "");
  });

  it("makes a note in the campaign, and leaves alone the note outside the Campaigns folder the link leads to", async () => {
    const { app, place, calls, leaf } = placeWith(PRIVATE);
    await openLink(app, place, "Primary", SESSION.path);
    expect(calls.create).toHaveBeenCalledWith("D&D/Pale Moon/Primary.md", "");
    expect(openedPaths(leaf)).toEqual(["D&D/Pale Moon/Primary.md"]);
    expect(calls.read).not.toHaveBeenCalled();
  });
});

describe("openLink refusing to make a note", () => {
  async function expectNothingMade(place: ReturnType<typeof placeWith>, linktext: string, sourcePath: string, notice: string) {
    await openLink(place.app, place.place, linktext, sourcePath);
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

  it("makes nothing where a note already sits, even when the link leads outside the Campaigns folder", async () => {
    const taken = fileAt("D&D/Pale Moon/Primary.md");
    await expectNothingMade(placeWith(PRIVATE, [SESSION, PRIVATE, taken]), "Primary", SESSION.path, notMade("Primary", takenAt(taken.path)));
  });

  it("makes nothing where a folder already sits", async () => {
    const folder = folderAt("D&D/Pale Moon/Notes.md", []);
    await expectNothingMade(placeWith(null, [SESSION], [folder]), "Notes.md", SESSION.path, notMade("Notes.md", takenAt(folder.path)));
  });
});
