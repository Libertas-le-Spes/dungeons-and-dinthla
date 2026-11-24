import { notesOverFakes } from "../../host/notes-over-fakes";
import { STUB_SPELLING } from "../../host/stub-spelling";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile, TFolder } from "obsidian";
import { Fence } from "../../../src/fence/paths/fence";
import { FencedFiles } from "../../../src/fence/gate/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../../src/fence/gate/fenced-metadata";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { notInCampaign, openLink } from "../../../src/views/opening/open-link";
import { fileAt, folderAt, rawVaultWith } from "../../fence/gate/fake-raw-vault";
import { Notice } from "../../stubs/obsidian";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const MIRA = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");

function placeWith(linkLeadsTo: TFile | null, files: TFile[] = [SESSION, MIRA, PRIVATE], folders: TFolder[] = []) {
  const { vault, calls } = rawVaultWith(files, folders);
  const raw = { getFirstLinkpathDest: vi.fn(() => linkLeadsTo) };
  const held = new HeldFiles(vault, new Fence(() => "D&D", ".obsidian", STUB_SPELLING));
  const fenced = new FencedFiles(vault, held, new NoteReporter());
  const metadata = new FencedMetadata(raw as unknown as RawMetadata, held);
  const gate = { files: fenced, metadata, notes: notesOverFakes({ files: fenced, metadata }) };
  const leaf = { openFile: vi.fn(async () => {}) };
  const openLinkText = vi.fn(async () => {});
  const app = { workspace: { getLeaf: vi.fn(() => leaf), openLinkText } } as unknown as App;
  return { app, place: { gate, campaignFolders: () => [CAMPAIGN] }, calls, raw, leaf, openLinkText, getLeaf: app.workspace.getLeaf };
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
    await openLink(app, place, "Mira", SESSION.path, false);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note in the tab in use for a plain press", async () => {
    const { app, place, getLeaf } = placeWith(MIRA);
    await openLink(app, place, "Mira", SESSION.path, false);
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("opens the note in a new tab when asked", async () => {
    const { app, place, getLeaf, leaf } = placeWith(MIRA);
    await openLink(app, place, "Mira", SESSION.path, "tab");
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
  });

  it("opens the note the link leads to in another campaign, as Obsidian resolves it", async () => {
    const elsewhere = fileAt("D&D/Ash Road/Characters/Brannoc.md");
    const { app, place, calls, leaf } = placeWith(elsewhere, [SESSION, elsewhere]);
    await openLink(app, place, "Brannoc", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([elsewhere.path]);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("opens nothing when the note the link leads to isn't in the vault", async () => {
    const { app, place, leaf } = placeWith(MIRA, [SESSION]);
    await openLink(app, place, "Mira", SESSION.path, false);
    expect(leaf.openFile).not.toHaveBeenCalled();
  });

  it("opens the note at the heading the link names", async () => {
    const { app, place, raw, leaf } = placeWith(MIRA);
    await openLink(app, place, "Mira#Background", SESSION.path, false);
    expect(raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "#Background" } });
  });
});

describe("openLink to a note in the campaign when the link leads outside the Campaigns folder", () => {
  const ROOT_MILL = fileAt("Old Mill.md");

  it("opens the note at the link's path in the campaign folder, at the heading it names", async () => {
    const there = fileAt("D&D/Pale Moon/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, there]);
    await openLink(app, place, "Old Mill#Cellar", SESSION.path, false);
    expect(leaf.openFile).toHaveBeenCalledWith(there, { eState: { subpath: "#Cellar" } });
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note at the link's path when the link names its .md", async () => {
    const there = fileAt("D&D/Pale Moon/Old Mill.md");
    const nearer = fileAt("D&D/Pale Moon/Sessions/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, nearer, there]);
    await openLink(app, place, "Old Mill.md", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([there.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the campaign's note in a new tab when asked", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, getLeaf, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", SESSION.path, "tab");
    expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(openedPaths(leaf)).toEqual([placed.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens a note of that name in a folder of the campaign, making no second one", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([placed.path]);
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note whose path ends with the folders the link names", async () => {
    const town = fileAt("D&D/Pale Moon/Places/Town/Inn.md");
    const road = fileAt("D&D/Pale Moon/Places/Road/Inn.md");
    const { app, place, leaf } = placeWith(null, [SESSION, road, town]);
    await openLink(app, place, "Town/Inn", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([town.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note at the link's path from the campaign folder before a nearer note that ends the same way", async () => {
    const exact = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const nearer = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, nearer, exact]);
    await openLink(app, place, "Places/Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([exact.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note at the link's path in other capitals before a nearer note that ends the same way", async () => {
    const exact = fileAt("D&D/Pale Moon/places/old mill.md");
    const nearer = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, nearer, exact]);
    await openLink(app, place, "Places/Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([exact.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("counts the folders down to a note in its nearness, not only those up from the link", async () => {
    const deeper = fileAt("D&D/Pale Moon/Places/Deep/Old Mill.md");
    const shallower = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, deeper, shallower]);
    await openLink(app, place, "Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([shallower.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("counts the folders up from the link in its nearness, not only those down to a note", async () => {
    const from = "D&D/Pale Moon/Sessions/Arc/Session 1.md";
    const sameBranch = fileAt("D&D/Pale Moon/Sessions/Zed/Old Mill.md");
    const otherBranch = fileAt("D&D/Pale Moon/Ash/Old Mill.md");
    const { app, place, leaf } = placeWith(null, [SESSION, sameBranch, otherBranch]);
    await openLink(app, place, "Old Mill", from, false);
    expect(openedPaths(leaf)).toEqual([sameBranch.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note of that name nearest to the note holding the link", async () => {
    const far = fileAt("D&D/Pale Moon/Places/Old/Old Mill.md");
    const near = fileAt("D&D/Pale Moon/Sessions/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, far, near]);
    await openLink(app, place, "Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([near.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens the first by path of two notes of that name as near as each other", async () => {
    const road = fileAt("D&D/Pale Moon/Road/Old Mill.md");
    const places = fileAt("D&D/Pale Moon/Places/Old Mill.md");
    const { app, place, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, road, places]);
    await openLink(app, place, "Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([places.path]);
    expect(Notice.shown).toEqual([]);
  });

  it("opens a note whose name differs from the link only in capitals", async () => {
    const placed = fileAt("D&D/Pale Moon/Places/old mill.md");
    const { app, place, calls, leaf } = placeWith(ROOT_MILL, [SESSION, ROOT_MILL, placed]);
    await openLink(app, place, "Old Mill", SESSION.path, false);
    expect(openedPaths(leaf)).toEqual([placed.path]);
    expect(calls.create).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([]);
  });
});

describe("openLink to a note that doesn't exist inside the campaign", () => {
  async function expectNothingMade(place: ReturnType<typeof placeWith>, linktext: string, sourcePath: string, notice: string) {
    await openLink(place.app, place.place, linktext, sourcePath, false);
    expect(place.calls.create).not.toHaveBeenCalled();
    expect(place.calls.createFolder).not.toHaveBeenCalled();
    expect(place.leaf.openFile).not.toHaveBeenCalled();
    expect(place.openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([notice]);
  }

  it("makes nothing, opens nothing and says the note doesn't exist inside the campaign yet", async () => {
    await expectNothingMade(placeWith(null), "Old Mill", SESSION.path, notInCampaign("Old Mill"));
  });

  it("names the note without the heading, block or shown name the link carries", async () => {
    await expectNothingMade(placeWith(null), "Old Mill#^cellar|the mill", SESSION.path, notInCampaign("Old Mill"));
    Notice.shown = [];
    await expectNothingMade(placeWith(null), "Old Mill|the mill", SESSION.path, notInCampaign("Old Mill"));
  });

  it("makes nothing, and leaves alone the note outside the Campaigns folder the link leads to", async () => {
    const place = placeWith(PRIVATE);
    await expectNothingMade(place, "Primary", SESSION.path, notInCampaign("Primary"));
    expect(place.calls.read).not.toHaveBeenCalled();
  });

  it("makes nothing for a link outside the Campaigns folder Obsidian resolves, with no note of that name in the campaign", async () => {
    await expectNothingMade(placeWith(fileAt("Old Mill.md"), [SESSION, fileAt("Old Mill.md")]), "Old Mill", SESSION.path, notInCampaign("Old Mill"));
  });

  it("makes nothing for a link whose folders the campaign doesn't hold", async () => {
    await expectNothingMade(placeWith(null, [SESSION], [folderAt("D&D/Pale Moon/Places", [])]), "Places/Town/Inn", SESSION.path, notInCampaign("Places/Town/Inn"));
  });

  it("makes nothing for a link that climbs out of the campaign", async () => {
    await expectNothingMade(placeWith(null), "../Private/x", SESSION.path, notInCampaign("../Private/x"));
  });

  it("makes nothing for a link from a note that isn't in a campaign", async () => {
    await expectNothingMade(placeWith(null), "Mira", PRIVATE.path, notInCampaign("Mira"));
  });

  it("makes nothing for a link from a note directly in the Campaigns folder", async () => {
    await expectNothingMade(placeWith(null), "Mira", "D&D/Loose.md", notInCampaign("Mira"));
  });

  it("makes nothing for a link that names no note, even when the campaign holds a note named .md", async () => {
    await expectNothingMade(placeWith(null, [SESSION, fileAt("D&D/Pale Moon/.md")]), "#Background", SESSION.path, notInCampaign(""));
  });

  it("makes nothing for a note in another campaign of that name", async () => {
    await expectNothingMade(placeWith(null, [SESSION, fileAt("D&D/Ashen Road/Old Mill.md")]), "Old Mill", SESSION.path, notInCampaign("Old Mill"));
  });

  it("makes nothing for a note in a campaign whose name starts with this one's", async () => {
    await expectNothingMade(placeWith(null, [SESSION, fileAt("D&D/Pale Moonlight/Places/Old Mill.md")]), "Old Mill", SESSION.path, notInCampaign("Old Mill"));
  });

  it("makes nothing for a note whose name only ends with the link's name", async () => {
    await expectNothingMade(placeWith(null, [SESSION, fileAt("D&D/Pale Moon/Places/Gold Mill.md")]), "Mill", SESSION.path, notInCampaign("Mill"));
  });
});
