import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { CampaignStore } from "../../../src/campaign/campaign-store";
import { SavedCampaign, type SavedCampaignNeeds } from "../../../src/campaign/saved-campaign";
import { Fence } from "../../../src/fence/fence";
import { FencedFileActions, type ChangeProperties, type RawFileManager } from "../../../src/fence/fenced-file-actions";
import { FencedFiles } from "../../../src/fence/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../../src/fence/fenced-metadata";
import { HeldFiles } from "../../../src/fence/held-files";
import { ItemHolders, type HolderStore } from "../../../src/funds/item-notes/item-holders";
import { FakeVault } from "../../campaign/fake-vault";
import { FakeEvents, rawVaultWith } from "../../fence/fake-raw-vault";
import { TFile as StubFile } from "../../stubs/obsidian";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = `${CAMPAIGN}/Sessions/Session 1.md`;
const LANTERN = `${CAMPAIGN}/Items/Silvered lantern.md`;
const ROPE = `${CAMPAIGN}/Items/Rope.md`;

type Properties = Record<string, unknown>;

interface ItemNote {
  path: string;
  properties: Properties | null;
}

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function fileAt(path: string): TFile {
  const name = nameOf(path);
  const dot = name.lastIndexOf(".");
  const file = Object.assign(new StubFile(), { path, name, basename: name.slice(0, dot), extension: name.slice(dot + 1) });
  return file as unknown as TFile;
}

function cacheOf(properties: Properties): CachedMetadata {
  if (Object.keys(properties).length === 0) return {};
  return { frontmatter: { ...properties } };
}

class ItemNotes {
  readonly written: { path: string; holder: unknown }[] = [];
  readonly failures: unknown[] = [];
  readonly foldersListed: string[] = [];
  afterWrite: () => void = () => {};
  private held: Promise<void> = Promise.resolve();
  private readonly notes: ItemNote[];

  constructor(notes: ItemNote[]) {
    this.notes = notes.map((note) => ({ ...note }));
  }

  holdWrites(): () => void {
    let release = (): void => {};
    this.held = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  }

  propertiesOf(path: string): Properties | null {
    return this.noteAt(path).properties;
  }

  needsFor(store: HolderStore) {
    return {
      store,
      files: { markdownFilesUnder: (path: string) => this.notesUnder(path) },
      metadata: {
        getFileCache: (file: TFile) => {
          const properties = this.noteAt(file.path).properties;
          if (properties === null) return null;
          return cacheOf(properties);
        },
      },
      actions: { processFrontMatter: async (file: TFile, change: ChangeProperties) => this.write(file, change) },
      failed: (error: unknown) => this.failures.push(error),
    };
  }

  private notesUnder(path: string): TFile[] {
    this.foldersListed.push(path);
    return this.notes.filter((note) => note.path.startsWith(`${path}/`) && note.path.endsWith(".md")).map((note) => fileAt(note.path));
  }

  private async write(file: TFile, change: ChangeProperties): Promise<void> {
    await this.held;
    const note = this.noteAt(file.path);
    const properties = { ...note.properties };
    change(properties);
    note.properties = properties;
    this.written.push({ path: file.path, holder: properties.holder });
    this.afterWrite();
  }

  private noteAt(path: string): ItemNote {
    const note = this.notes.find((candidate) => candidate.path === path);
    if (note === undefined) throw new Error(`No item note at ${path}`);
    return note;
  }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));
}

async function keepHolders(lines: string[], notes: ItemNote[]) {
  const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
  const store = new CampaignStore(sessions.vault);
  const itemNotes = new ItemNotes(notes);
  const stop = new ItemHolders(itemNotes.needsFor(store)).start();
  await store.open(CAMPAIGN);
  await settle();
  const reread = (more: string[] = lines) => store.noteChanged(SESSION, more.join("\n"));
  return { store, itemNotes, stop, reread };
}

describe("ItemHolders", () => {
  it("writes a holder written as a link as a link", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "[[Mira]]" }]);
  });

  it("writes a holder written plainly as plain text", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to Old Tom"], [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "Old Tom" }]);
  });

  it("writes the party for an item the party holds", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to the party"], [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "The party" }]);
  });

  it("writes the party for an item named with no holder", async () => {
    const { itemNotes } = await keepHolders(["$ Silvered lantern"], [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "The party" }]);
  });

  it("writes the last holder of a gone item", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]", "$$ Silvered lantern :sold 30 gp"];
    const { itemNotes } = await keepHolders(lines, [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "[[Mira]]" }]);
  });

  it("gives a holder to a note without properties", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: {} }]);
    expect(itemNotes.propertiesOf(LANTERN)).toEqual({ holder: "[[Mira]]" });
  });

  it("writes a new holder over the old one and keeps the note's other properties", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: { holder: "The party", tags: ["key"] } }]);
    expect(itemNotes.propertiesOf(LANTERN)).toEqual({ holder: "[[Mira]]", tags: ["key"] });
  });

  it("writes the new holder when a session line gives the item to someone else", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const { itemNotes, reread } = await keepHolders(lines, [{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    reread([...lines, "$$ Silvered lantern :changed to Old Tom"]);
    await settle();
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "Old Tom" }]);
  });

  it("writes the same note again once its first write is done", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const { itemNotes, reread } = await keepHolders(lines, [{ path: LANTERN, properties: {} }]);
    reread([...lines, "$$ Silvered lantern :changed to Old Tom"]);
    await settle();
    expect(itemNotes.written).toEqual([
      { path: LANTERN, holder: "[[Mira]]" },
      { path: LANTERN, holder: "Old Tom" },
    ]);
  });

  it("writes the newer holder that came while its write was still going", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    const release = itemNotes.holdWrites();
    new ItemHolders(itemNotes.needsFor(store)).start();
    await store.open(CAMPAIGN);
    store.noteChanged(SESSION, [...lines, "$$ Silvered lantern :changed to Old Tom"].join("\n"));
    release();
    await settle();
    expect(itemNotes.propertiesOf(LANTERN)).toEqual({ holder: "Old Tom" });
  });

  it("writes nothing when the note already holds the holder", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    expect(itemNotes.written).toEqual([]);
  });

  it("writes at once when started after the campaign is open", async () => {
    const sessions = new FakeVault([{ path: SESSION, text: "$$ Silvered lantern :changed to [[Mira]]" }]);
    const store = new CampaignStore(sessions.vault);
    await store.open(CAMPAIGN);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    new ItemHolders(itemNotes.needsFor(store)).start();
    await settle();
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "[[Mira]]" }]);
  });

  it("writes nothing more when its own write makes the campaign be read again", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    let rereads = 0;
    itemNotes.afterWrite = () => {
      if (rereads >= 5) return;
      rereads += 1;
      setTimeout(() => {
        store.noteChanged(LANTERN, "");
        store.noteChanged(SESSION, lines.join("\n"));
      }, 0);
    };
    new ItemHolders(itemNotes.needsFor(store)).start();
    await store.open(CAMPAIGN);
    await settle();
    expect(rereads).toBe(1);
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "[[Mira]]" }]);
  });

  it("writes no holder from a campaign only half read when a session note changes while the campaign opens", async () => {
    const later = `${CAMPAIGN}/Sessions/Session 2.md`;
    const sessions = new FakeVault([
      { path: SESSION, text: "$$ Silvered lantern :changed to [[Mira]]" },
      { path: later, text: "$$ Silvered lantern :changed to Old Tom" },
    ]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: { holder: "Old Tom" } }]);
    new ItemHolders(itemNotes.needsFor(store)).start();
    const release = sessions.holdReadsOf(later);
    const opening = store.open(CAMPAIGN);
    store.noteChanged(SESSION, "$$ Silvered lantern :changed to [[Mira]]");
    await settle();
    release();
    await opening;
    await settle();
    expect(itemNotes.written).toEqual([]);
  });

  it("writes a note once while its write is still going when the campaign is read again", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    const release = itemNotes.holdWrites();
    new ItemHolders(itemNotes.needsFor(store)).start();
    await store.open(CAMPAIGN);
    store.noteChanged(SESSION, lines.join("\n"));
    store.noteChanged(SESSION, lines.join("\n"));
    release();
    await settle();
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "[[Mira]]" }]);
  });

  it("writes only the item notes whose holder differs", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]", "$$ Rope :changed to Old Tom"];
    const notes = [
      { path: LANTERN, properties: { holder: "[[Mira]]" } },
      { path: ROPE, properties: { holder: "The party" } },
    ];
    const { itemNotes } = await keepHolders(lines, notes);
    expect(itemNotes.written).toEqual([{ path: ROPE, holder: "Old Tom" }]);
  });

  it("makes no item note for an item that has none", async () => {
    const { itemNotes } = await keepHolders(["$$ Rope :changed to Old Tom"], []);
    expect(itemNotes.written).toEqual([]);
  });

  it("leaves an item note that no session line names", async () => {
    const { itemNotes } = await keepHolders(["$$ Rope :changed to Old Tom"], [{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    expect(itemNotes.written).toEqual([]);
  });

  it("leaves a note named after an item outside the campaign's Items folder", async () => {
    const notes = [
      { path: `${CAMPAIGN}/Silvered lantern.md`, properties: {} },
      { path: "D&D/Ash Road/Items/Silvered lantern.md", properties: {} },
    ];
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], notes);
    expect(itemNotes.written).toEqual([]);
  });

  it("looks only in the campaign's Items folder", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: {} }]);
    expect(new Set(itemNotes.foldersListed)).toEqual(new Set([`${CAMPAIGN}/Items`]));
  });

  it("leaves a file in the Items folder that isn't a note, even one named as an item is", async () => {
    const { itemNotes } = await keepHolders(["$$ Old map.canvas :changed to [[Mira]]"], [{ path: `${CAMPAIGN}/Items/Old map.canvas`, properties: {} }]);
    expect(itemNotes.written).toEqual([]);
  });

  it("leaves an item note Obsidian hasn't read yet", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: null }]);
    expect(itemNotes.written).toEqual([]);
  });

  it("stops writing once stopped", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const { itemNotes, stop, reread } = await keepHolders(lines, [{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    stop();
    reread([...lines, "$$ Silvered lantern :changed to Old Tom"]);
    await settle();
    expect(itemNotes.written).toEqual([]);
  });

  it("says when a holder couldn't be written and goes on with the other notes", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]", "$$ Rope :changed to Old Tom"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([
      { path: LANTERN, properties: {} },
      { path: ROPE, properties: {} },
    ]);
    const needs = itemNotes.needsFor(store);
    const refused = new Error("refused");
    const write = needs.actions.processFrontMatter;
    needs.actions.processFrontMatter = async (file, change) => {
      if (file.path === LANTERN) throw refused;
      await write(file, change);
    };
    new ItemHolders(needs).start();
    await store.open(CAMPAIGN);
    await settle();
    expect(itemNotes.failures).toEqual([refused]);
    expect(itemNotes.written).toEqual([{ path: ROPE, holder: "Old Tom" }]);
  });

  it("writes a holder again once a later write to that note succeeded", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    const needs = itemNotes.needsFor(store);
    const write = needs.actions.processFrontMatter;
    let refused = false;
    needs.actions.processFrontMatter = async (file, change) => {
      if (!refused) {
        refused = true;
        throw new Error("refused");
      }
      await write(file, change);
    };
    new ItemHolders(needs).start();
    await store.open(CAMPAIGN);
    await settle();
    store.noteChanged(SESSION, [...lines, "$$ Silvered lantern :changed to Old Tom"].join("\n"));
    await settle();
    store.noteChanged(SESSION, lines.join("\n"));
    await settle();
    expect(itemNotes.written).toEqual([
      { path: LANTERN, holder: "Old Tom" },
      { path: LANTERN, holder: "[[Mira]]" },
    ]);
  });

  it("says once that a holder couldn't be written however often the campaign is read again", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    const needs = itemNotes.needsFor(store);
    needs.actions.processFrontMatter = async () => {
      throw new Error("refused");
    };
    new ItemHolders(needs).start();
    await store.open(CAMPAIGN);
    await settle();
    for (let read = 0; read < 3; read++) {
      store.noteChanged(SESSION, lines.join("\n"));
      await settle();
    }
    expect(itemNotes.failures).toHaveLength(1);
  });
});

describe("ItemHolders from the saved session notes", () => {
  async function keepSavedHolders(lines: string[]) {
    const sessions = new FakeVault([{ path: SESSION, text: lines.join("\n") }]);
    const fileEvents = new FakeEvents();
    const metadataEvents = new FakeEvents();
    const files = { ...sessions.vault, on: fileEvents.on.bind(fileEvents), offref: fileEvents.offref.bind(fileEvents) } as unknown as SavedCampaignNeeds["files"];
    const metadata = { on: metadataEvents.on.bind(metadataEvents), offref: metadataEvents.offref.bind(metadataEvents) } as unknown as SavedCampaignNeeds["metadata"];
    const shown = new CampaignStore(sessions.vault);
    const saved = new SavedCampaign({ shown, files, metadata, failed: () => {} });
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    new ItemHolders(itemNotes.needsFor(saved)).start();
    saved.start();
    await shown.open(CAMPAIGN);
    await settle();
    const saveSession = (text: string) => metadataEvents.trigger("changed", { path: SESSION }, text, {});
    return { shown, itemNotes, saveSession };
  }

  it("writes nothing while a holder is being typed and once when the session is saved", async () => {
    const lines = ["$$ Silvered lantern :changed to [[Mira]]"];
    const { shown, itemNotes, saveSession } = await keepSavedHolders(lines);
    for (const typed of ["O", "Ol", "Old", "Old T", "[[Mi"]) {
      shown.noteChanged(SESSION, [...lines, `$$ Silvered lantern :changed to ${typed}`].join("\n"));
      await settle();
    }
    saveSession([...lines, "$$ Silvered lantern :changed to Old Tom"].join("\n"));
    await settle();
    expect(itemNotes.written).toEqual([{ path: LANTERN, holder: "Old Tom" }]);
  });
});

describe("ItemHolders through the gate", () => {
  async function keepHoldersThroughGate(campaign: string, itemPath: string) {
    const file = fileAt(itemPath);
    const raw = rawVaultWith([file]);
    const fence = new Fence(() => "D&D", ".obsidian");
    const held = new HeldFiles(raw.vault, fence);
    const processFrontMatter = vi.fn(async (_file: TFile, change: ChangeProperties) => change({}));
    const rawFileManager = { processFrontMatter } as unknown as RawFileManager;
    const rawMetadata = { getFileCache: () => cacheOf({}) } as unknown as RawMetadata;
    const sessions = new FakeVault([{ path: `${campaign}/Sessions/Session 1.md`, text: "$$ Silvered lantern :changed to [[Mira]]" }]);
    const store = new CampaignStore(sessions.vault);
    const failures: unknown[] = [];
    const needs = {
      store,
      files: new FencedFiles(raw.vault, held),
      metadata: new FencedMetadata(rawMetadata, held),
      actions: new FencedFileActions(rawFileManager, held),
      failed: (error: unknown) => failures.push(error),
    };
    new ItemHolders(needs).start();
    await store.open(campaign);
    await settle();
    return { processFrontMatter, failures };
  }

  it("writes an item note inside the Campaigns folder", async () => {
    const { processFrontMatter } = await keepHoldersThroughGate(CAMPAIGN, LANTERN);
    expect(processFrontMatter).toHaveBeenCalledOnce();
  });

  it("never writes an item note outside the Campaigns folder", async () => {
    const { processFrontMatter } = await keepHoldersThroughGate("Self/Pale Moon", "Self/Pale Moon/Items/Silvered lantern.md");
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it("never writes an item note in a folder inside Items whose name the fence refuses", async () => {
    const { processFrontMatter } = await keepHoldersThroughGate(CAMPAIGN, `${CAMPAIGN}/Items/Old./Silvered lantern.md`);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });
});
