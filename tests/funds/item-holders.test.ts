import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { CampaignStore } from "../../src/campaign/campaign-store";
import { Fence } from "../../src/fence/fence";
import { FencedFileActions, type ChangeProperties, type RawFileManager } from "../../src/fence/fenced-file-actions";
import { FencedFiles } from "../../src/fence/fenced-files";
import { FencedMetadata, type RawMetadata } from "../../src/fence/fenced-metadata";
import { HeldFiles } from "../../src/fence/held-files";
import { ItemHolders } from "../../src/funds/item-holders";
import { FakeVault } from "../campaign/fake-vault";
import { rawVaultWith } from "../fence/fake-raw-vault";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = `${CAMPAIGN}/Sessions/Session 1.md`;
const LANTERN = `${CAMPAIGN}/Items/Silvered lantern.md`;
const ROPE = `${CAMPAIGN}/Items/Rope.md`;

type Properties = Record<string, unknown>;

interface ItemNote {
  path: string;
  properties: Properties | null;
}

function fileAt(path: string): TFile {
  return { path, name: path.slice(path.lastIndexOf("/") + 1) } as TFile;
}

function cacheOf(properties: Properties): CachedMetadata {
  return { frontmatter: { ...properties } };
}

class ItemNotes {
  readonly written: { path: string; holder: unknown }[] = [];
  readonly failures: unknown[] = [];
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

  setProperties(path: string, properties: Properties): void {
    this.noteAt(path).properties = properties;
  }

  needsFor(store: CampaignStore) {
    return {
      store,
      files: { getMarkdownFiles: () => this.notes.map((note) => fileAt(note.path)) },
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

  it("writes nothing when the note already holds the holder", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: { holder: "[[Mira]]" } }]);
    expect(itemNotes.written).toEqual([]);
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

  it("leaves an item note Obsidian hasn't read yet", async () => {
    const { itemNotes } = await keepHolders(["$$ Silvered lantern :changed to [[Mira]]"], [{ path: LANTERN, properties: null }]);
    expect(itemNotes.written).toEqual([]);
  });

  it("writes nothing while no campaign is open", async () => {
    const sessions = new FakeVault([{ path: SESSION, text: "$$ Silvered lantern :changed to [[Mira]]" }]);
    const store = new CampaignStore(sessions.vault);
    const itemNotes = new ItemNotes([{ path: LANTERN, properties: {} }]);
    new ItemHolders(itemNotes.needsFor(store)).start();
    store.close();
    await settle();
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
});
