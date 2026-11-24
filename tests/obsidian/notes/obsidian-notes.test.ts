import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { ObsidianNotes } from "../../../src/obsidian/notes/obsidian-notes";
import { FakeEvents } from "../../fence/gate/fake-raw-vault";

const SESSION = { path: "D&D/Pale Moon/Sessions/Session 1.md", basename: "Session 1", stat: { mtime: 42 } } as unknown as TFile;

function gateWith(files: TFile[] = [SESSION]) {
  const fileEvents = new FakeEvents();
  const metadataEvents = new FakeEvents();
  const byPath = (path: string) => files.find((file) => file.path === path) ?? null;
  const gate = {
    files: {
      getFileByPath: vi.fn(byPath),
      getFolderByPath: vi.fn((path: string) => (path === "D&D/Pale Moon" ? {} : null)),
      getMarkdownFiles: vi.fn(() => files),
      getFiles: vi.fn(() => files),
      markdownFilesUnder: vi.fn(() => files),
      namesIn: vi.fn(() => ["Sessions"]),
      read: vi.fn(async () => "? Who"),
      cachedRead: vi.fn(async () => "? Who, kept"),
      process: vi.fn(async (_file: TFile, edit: (text: string) => string) => edit("? Who")),
      create: vi.fn(async (path: string) => ({ path, basename: "Rope" })),
      createFolder: vi.fn(async () => ({})),
      removeEmptyFolder: vi.fn(async () => {}),
      rename: vi.fn(async () => {}),
      on: fileEvents.on.bind(fileEvents),
      offref: fileEvents.offref.bind(fileEvents),
    },
    fileActions: { renameFile: vi.fn(async () => {}), trashFile: vi.fn(async () => {}), processFrontMatter: vi.fn(async () => {}) },
    metadata: {
      getFileCache: vi.fn(() => ({
        frontmatter: { character: "[[Mira]]" },
        links: [{ link: "Mira", position: { start: { line: 3 } } }],
        embeds: [{ link: "Map.png", position: { start: { line: 5 } } }],
        frontmatterLinks: [{ key: "character", link: "Mira" }],
      })),
      getFirstLinkpathDest: vi.fn(() => SESSION),
      fileToLinktext: vi.fn(() => "Session 1"),
      unresolvedLinksOf: vi.fn(() => ["Vess"]),
      resolvedLinks: { [SESSION.path]: { "D&D/Pale Moon/Characters/Mira.md": 1 } },
      on: metadataEvents.on.bind(metadataEvents),
      offref: metadataEvents.offref.bind(metadataEvents),
    },
    vaultSettings: { trashOption: vi.fn(() => "local") },
  };
  return { notes: new ObsidianNotes(gate as never), gate, fileEvents, metadataEvents };
}

describe("Obsidian's answers to the plugin's notes ports", () => {
  it("hands out the gate's own file objects as notes, and finds folders and names through it", () => {
    const { notes, gate } = gateWith();
    expect(notes.note(SESSION.path)).toBe(SESSION);
    expect(notes.notes()).toEqual([SESSION]);
    expect(notes.hasFolder("D&D/Pale Moon")).toBe(true);
    expect(notes.hasFolder("D&D/Elsewhere")).toBe(false);
    expect(notes.namesIn("D&D/Pale Moon")).toEqual(["Sessions"]);
    expect(gate.files.getFileByPath).toHaveBeenCalledWith(SESSION.path);
  });

  it("reads, keeps-reads, changes and moves a note through the gate, and gives its change time", async () => {
    const { notes, gate } = gateWith();
    expect(await notes.read(SESSION)).toBe("? Who");
    expect(await notes.readKept(SESSION)).toBe("? Who, kept");
    expect(await notes.change(SESSION, (text) => `${text}!`)).toBe("? Who!");
    await notes.move(SESSION, "D&D/Pale Moon/Sessions/Session 2.md");
    expect(gate.files.rename).toHaveBeenCalledExactlyOnceWith(SESSION, "D&D/Pale Moon/Sessions/Session 2.md");
    expect(notes.changedAt(SESSION)).toBe(42);
  });

  it("refuses a note that isn't the gate's own object for its path, calling nothing", async () => {
    const { notes, gate } = gateWith();
    const forged = { path: SESSION.path, basename: "Session 1" };
    await expect(async () => notes.read(forged)).rejects.toThrow("Only notes the gate handed out");
    expect(gate.files.read).not.toHaveBeenCalled();
  });

  it("moves with links, throws away and changes properties through the gate's file actions", async () => {
    const { notes, gate } = gateWith();
    const change = vi.fn();
    await notes.moveWithLinks(SESSION, "D&D/Pale Moon/Sessions/Session 3.md");
    await notes.throwAway(SESSION);
    await notes.changeProperties(SESSION, change);
    expect(gate.fileActions.renameFile).toHaveBeenCalledExactlyOnceWith(SESSION, "D&D/Pale Moon/Sessions/Session 3.md");
    expect(gate.fileActions.trashFile).toHaveBeenCalledExactlyOnceWith(SESSION);
    expect(gate.fileActions.processFrontMatter).toHaveBeenCalledExactlyOnceWith(SESSION, change);
  });

  it.each([
    ["local", false],
    ["system", false],
    ["none", true],
  ])("says a throw-away is for good when Obsidian's trash setting is %s: %s", (option, forGood) => {
    const { notes, gate } = gateWith();
    gate.vaultSettings.trashOption.mockReturnValue(option);
    expect(notes.throwsAwayForGood()).toBe(forGood);
  });

  it("gives what Obsidian knows of a note's text in the plugin's own shapes", () => {
    const { notes } = gateWith();
    expect(notes.propertiesOf(SESSION)).toEqual({ character: "[[Mira]]" });
    expect(notes.linksIn(SESSION)).toEqual([{ linkText: "Mira", line: 3 }]);
    expect(notes.embedsIn(SESSION)).toEqual([{ linkText: "Map.png", line: 5 }]);
    expect(notes.propertyLinksIn(SESSION)).toEqual([{ key: "character", linkText: "Mira" }]);
  });

  it("finds links' targets, link text, unresolved links and link counts through the gate's metadata", () => {
    const { notes, gate } = gateWith();
    expect(notes.target("Session 1", SESSION.path)).toBe(SESSION);
    expect(notes.linkTextTo(SESSION, "D&D/Pale Moon/Pale Moon.md", true)).toBe("Session 1");
    expect(gate.metadata.fileToLinktext).toHaveBeenCalledExactlyOnceWith(SESSION, "D&D/Pale Moon/Pale Moon.md", true);
    expect(notes.unresolvedIn(SESSION.path)).toEqual(["Vess"]);
    expect(notes.linkCounts()).toEqual({ [SESSION.path]: { "D&D/Pale Moon/Characters/Mira.md": 1 } });
  });

  it("tells of notes made, changed, moved and gone, passing folders over, and stops through the gate", () => {
    const { notes, fileEvents } = gateWith();
    const heard: string[] = [];
    const stop = notes.onChanged((note) => void heard.push(`changed ${note.path}`));
    notes.onMade((note) => void heard.push(`made ${note.path}`));
    notes.onMoved((note, oldPath) => void heard.push(`moved ${oldPath} to ${note.path}`));
    notes.onGone((path) => void heard.push(`gone ${path}`));
    fileEvents.trigger("modify", SESSION);
    fileEvents.trigger("create", { path: "D&D/Pale Moon/Items", children: [] });
    fileEvents.trigger("rename", SESSION, "D&D/old.md");
    fileEvents.trigger("delete", { path: "D&D/gone.md" });
    stop();
    expect(heard).toEqual([`changed ${SESSION.path}`, `moved D&D/old.md to ${SESSION.path}`, "gone D&D/gone.md"]);
    expect(fileEvents.stopped).toHaveLength(1);
  });

  it("tells of a folder moved, passing notes over", () => {
    const { notes, fileEvents } = gateWith();
    const heard: string[] = [];
    const stop = notes.onFolderMoved((path, oldPath) => void heard.push(`${oldPath} to ${path}`));
    fileEvents.trigger("rename", { path: "D&D/Ashen Road", children: [] }, "D&D/Pale Moon");
    fileEvents.trigger("rename", SESSION, "D&D/old.md");
    stop();
    expect(heard).toEqual(["D&D/Pale Moon to D&D/Ashen Road"]);
    expect(fileEvents.stopped).toHaveLength(1);
  });

  it("tells when Obsidian has read a note, with the text it read, and when its links are settled", () => {
    const { notes, metadataEvents } = gateWith();
    const heard: string[] = [];
    notes.onRead((note, text) => void heard.push(`read ${note.path}: ${text}`));
    const stop = notes.onLinksSettled((note) => void heard.push(`settled ${note.path}`));
    metadataEvents.trigger("changed", SESSION, "? Who", {});
    metadataEvents.trigger("resolve", SESSION);
    stop();
    expect(heard).toEqual([`read ${SESSION.path}: ? Who`, `settled ${SESSION.path}`]);
    expect(metadataEvents.stopped).toHaveLength(1);
  });
});
