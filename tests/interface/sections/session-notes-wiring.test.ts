import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/campaign-store";
import { Fence } from "../../../src/fence/fence";
import { FencedFileActions, type RawFileManager } from "../../../src/fence/fenced-file-actions";
import { FencedFiles } from "../../../src/fence/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../../src/fence/fenced-metadata";
import { HeldFiles } from "../../../src/fence/held-files";
import { sessionNotesWiring } from "../../../src/interface/sections/session-notes-wiring";
import { NoteDrafts } from "../../../src/note-editing/note-drafts";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { KeptDrafts } from "../../../src/session-notes/kept/kept-drafts";
import { FakeEvents, fileAt, rawVaultWith } from "../../fence/fake-raw-vault";

const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const CACHE = { frontmatter: { title: "The Old Mill" } } as unknown as CachedMetadata;

function wiredWith(trashOption: string) {
  const { vault } = rawVaultWith([SESSION]);
  const held = new HeldFiles(vault, new Fence(() => "D&D", ".obsidian"));
  const events = new FakeEvents();
  const rawMetadata = {
    getCache: vi.fn(() => CACHE),
    getFileCache: vi.fn(() => CACHE),
    getFirstLinkpathDest: vi.fn((): TFile | null => null),
    fileToLinktext: vi.fn((file: TFile) => file.path),
    resolvedLinks: {},
    on: (name: string, callback: (...data: unknown[]) => unknown) => events.on(name, callback),
    offref: vi.fn(),
  };
  const fileManager = { processFrontMatter: vi.fn(), renameFile: vi.fn(), trashFile: vi.fn() };
  const gate = {
    files: new FencedFiles(vault, held),
    fileActions: new FencedFileActions(fileManager as unknown as RawFileManager, held),
    metadata: new FencedMetadata(rawMetadata as unknown as RawMetadata, held),
    vaultSettings: { trashOption: () => trashOption },
  };
  const drafts = new Drafts({}, () => {});
  const keeping = { keptDrafts: new KeptDrafts(drafts, () => 1_000), noteDrafts: new NoteDrafts(drafts) };
  const needs = {
    gate,
    store: new CampaignStore(gate.files),
    drafts,
    keeping,
    openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    confirm: vi.fn(),
    startSession: vi.fn(),
  };
  return { wiring: sessionNotesWiring(needs), needs, rawMetadata };
}

describe("sessionNotesWiring", () => {
  it("hands the session notes page the drafts and kept drafts it is given", () => {
    const { wiring, needs } = wiredWith("local");
    expect(wiring.notes.drafts).toBe(needs.drafts);
    expect(wiring.notes.keptDrafts).toBe(needs.keeping.keptDrafts);
    expect(wiring.notes.store).toBe(needs.store);
  });

  it("edits whole notes with the note drafts it is given, and shares that with the session notes page", () => {
    const { wiring, needs } = wiredWith("local");
    expect(wiring.wholeText.drafts).toBe(needs.keeping.noteDrafts);
    expect(wiring.notes.wholeText).toBe(wiring.wholeText);
  });

  it("reads a session's properties through the fenced metadata", () => {
    const { wiring, rawMetadata } = wiredWith("local");
    expect(wiring.notes.propertiesOf(SESSION.path).title).toBe("The Old Mill");
    expect(rawMetadata.getCache).toHaveBeenCalledExactlyOnceWith(SESSION.path);
  });

  it("deletes a session note for good only when Obsidian keeps no trash", () => {
    expect(wiredWith("none").wiring.notes.removal.trash.deletesPermanently()).toBe(true);
    expect(wiredWith("local").wiring.notes.removal.trash.deletesPermanently()).toBe(false);
  });

  it("asks with the confirm it is given and starts a session with the starter it is given", () => {
    const { wiring, needs } = wiredWith("local");
    wiring.notes.startSession();
    expect(needs.startSession).toHaveBeenCalledOnce();
    expect(wiring.notes.removal.confirm).toBe(needs.confirm);
  });
});
