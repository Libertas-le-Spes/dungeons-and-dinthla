import { beforeEach, describe, expect, it, vi } from "vitest";
import { Notice, type App, type TFile } from "obsidian";
import { Fence } from "../../src/fence/fence";
import { FencedMetadata, type RawMetadata } from "../../src/fence/fenced-metadata";
import { HeldFiles } from "../../src/fence/held-files";
import { missingInCampaignsFolder, openLink } from "../../src/views/open-link";
import { fileAt, rawVaultWith } from "../fence/fake-raw-vault";

const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const MIRA = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");

function gateWhereLinkLeadsTo(found: TFile | null) {
  const { vault } = rawVaultWith([SESSION, MIRA, PRIVATE]);
  const raw = { getFirstLinkpathDest: vi.fn(() => found) };
  const held = new HeldFiles(vault, new Fence(() => "D&D"));
  return { metadata: new FencedMetadata(raw as unknown as RawMetadata, held), raw };
}

function workspace() {
  const leaf = { openFile: vi.fn(async () => {}) };
  const openLinkText = vi.fn(async () => {});
  const app = { workspace: { getLeaf: vi.fn(() => leaf), openLinkText } } as unknown as App;
  return { app, leaf, openLinkText };
}

beforeEach(() => {
  Notice.shown = [];
});

describe("openLink", () => {
  it("opens a note the link leads to inside the Campaigns folder", async () => {
    const gate = gateWhereLinkLeadsTo(MIRA);
    const { app, leaf } = workspace();
    await openLink(app, gate, "Mira", SESSION.path);
    expect(gate.raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "" } });
    expect(Notice.shown).toEqual([]);
  });

  it("opens the note at the heading the link names", async () => {
    const gate = gateWhereLinkLeadsTo(MIRA);
    const { app, leaf } = workspace();
    await openLink(app, gate, "Mira#Background", SESSION.path);
    expect(gate.raw.getFirstLinkpathDest).toHaveBeenCalledWith("Mira", SESSION.path);
    expect(leaf.openFile).toHaveBeenCalledWith(MIRA, { eState: { subpath: "#Background" } });
  });

  it("opens nothing for a link to a note outside the Campaigns folder, and says so", async () => {
    const { app, leaf, openLinkText } = workspace();
    await openLink(app, gateWhereLinkLeadsTo(PRIVATE), "Private/Primary", SESSION.path);
    expect(leaf.openFile).not.toHaveBeenCalled();
    expect(openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual([missingInCampaignsFolder("Private/Primary")]);
  });

  it("makes no note for a link to a note that doesn't exist, and says so", async () => {
    const { app, leaf, openLinkText } = workspace();
    await openLink(app, gateWhereLinkLeadsTo(null), "Old Mill", SESSION.path);
    expect(leaf.openFile).not.toHaveBeenCalled();
    expect(openLinkText).not.toHaveBeenCalled();
    expect(Notice.shown).toEqual(["Old Mill doesn't exist inside the Campaigns folder."]);
  });

  it("opens nothing for a link from a note outside the Campaigns folder", async () => {
    const gate = gateWhereLinkLeadsTo(MIRA);
    const { app, leaf } = workspace();
    await openLink(app, gate, "Mira", PRIVATE.path);
    expect(leaf.openFile).not.toHaveBeenCalled();
    expect(gate.raw.getFirstLinkpathDest).not.toHaveBeenCalled();
  });
});
