import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, EventRef, TFile } from "obsidian";
import { TabBackground, type TabCampaign, type TabMetadata, type TabFiles } from "../../../../src/obsidian/interface/view/tab-background";
import { pictureOf } from "../../../campaign/shown-picture";
import { obsidianDocument } from "../../../stubs/obsidian-dom";

type Listener = (file: { path: string }) => void;

class Events {
  readonly listeners = new Map<string, Listener[]>();
  readonly removed: string[] = [];

  on(name: string, listener: Listener): EventRef {
    this.listeners.set(name, [...this.listenersTo(name), listener]);
    return { name } as unknown as EventRef;
  }

  offref(ref: EventRef): void {
    this.removed.push((ref as unknown as { name: string }).name);
  }

  fire(name: string, path: string): void {
    for (const listener of this.listenersTo(name)) listener({ path });
  }

  private listenersTo(name: string): Listener[] {
    const named = this.listeners.get(name);
    if (named === undefined) return [];
    return named;
  }
}

class FakeCampaign implements TabCampaign {
  private readonly listeners = new Set<() => void>();

  constructor(public campaignFolder: string | null) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  moveTo(folder: string | null): void {
    this.campaignFolder = folder;
    for (const listener of this.listeners) listener();
  }

  get listening(): number {
    return this.listeners.size;
  }
}

function pictureLink(link: string, wash: string): CachedMetadata {
  return {
    frontmatter: { background: `[[${link}]]`, wash },
    frontmatterLinks: [{ key: "background", link, original: `[[${link}]]` }],
  };
}

class FakeFiles extends Events {
  readonly caches = new Map<string, CachedMetadata>();
  readonly pictures = new Set<string>();
  resourceRoot = "app://vault/";

  readonly metadata = {
    getCache: (path: string) => this.cacheAt(path),
    getFirstLinkpathDest: (linkpath: string) => this.pictureAt(linkpath),
    on: (name: string, listener: Listener) => this.on(`metadata ${name}`, listener),
    offref: (ref: EventRef) => this.offref(ref),
  } as unknown as TabMetadata;

  readonly vault = {
    getResourcePath: (file: TFile) => `${this.resourceRoot}${file.path}`,
    on: (name: string, listener: Listener) => this.on(`vault ${name}`, listener),
    offref: (ref: EventRef) => this.offref(ref),
  } as unknown as TabFiles;

  private cacheAt(path: string): CachedMetadata | null {
    const cache = this.caches.get(path);
    if (cache === undefined) return null;
    return cache;
  }

  private pictureAt(linkpath: string): TFile | null {
    const path = `Art/${linkpath}`;
    if (!this.pictures.has(path)) return null;
    return { path, extension: "jpg" } as TFile;
  }
}

const HARBOUR = "Harbour Watch";
const HARBOUR_NOTE = "Harbour Watch/Harbour Watch.md";
const MEADOW = "Green Meadow";
const MEADOW_NOTE = "Green Meadow/Green Meadow.md";

function opened(folder: string | null = HARBOUR, files = new FakeFiles()) {
  files.pictures.add("Art/harbour.jpg");
  files.pictures.add("Art/meadow.jpg");
  files.caches.set(HARBOUR_NOTE, pictureLink("harbour.jpg", "strong"));
  files.caches.set(MEADOW_NOTE, {});
  const campaign = new FakeCampaign(folder);
  const frameEl = obsidianDocument().body.createDiv({ cls: "dd-campaign-frame" });
  const background = new TabBackground(frameEl, campaign, files.metadata, files.vault);
  background.load();
  return { files, campaign, frameEl, background };
}

describe("TabBackground", () => {
  it("shows the open campaign's picture behind the tab, under its wash", () => {
    const { frameEl } = opened();
    expect(frameEl.className).toBe("dd-campaign-frame dd-tab-picture dd-tab-wash-strong");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/harbour.jpg")');
  });

  it("shows nothing behind the tab when no campaign is open", () => {
    const { frameEl } = opened(null);
    expect(frameEl.className).toBe("dd-campaign-frame");
    expect(pictureOf(frameEl)).toBe("");
  });

  it("follows a new picture and wash written to the campaign's main note", () => {
    const { files, frameEl } = opened();
    files.caches.set(HARBOUR_NOTE, pictureLink("meadow.jpg", "subtle"));
    files.fire("metadata changed", HARBOUR_NOTE);
    expect(frameEl.className).toBe("dd-campaign-frame dd-tab-picture dd-tab-wash-subtle");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/meadow.jpg")');
  });

  it("goes back to the plain page colour when the main note's background is removed", () => {
    const { files, frameEl } = opened();
    files.caches.set(HARBOUR_NOTE, { frontmatter: { wash: "strong" } });
    files.fire("metadata changed", HARBOUR_NOTE);
    expect(frameEl.className).toBe("dd-campaign-frame");
    expect(pictureOf(frameEl)).toBe("");
  });

  it("leaves the picture as it is when any other note changes", () => {
    const { files, frameEl } = opened();
    files.caches.set(HARBOUR_NOTE, pictureLink("meadow.jpg", "subtle"));
    files.fire("metadata changed", "Harbour Watch/Sessions/Session 1.md");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/harbour.jpg")');
  });

  it("shows the other campaign's picture when you move to it", () => {
    const { files, campaign, frameEl } = opened();
    files.caches.set(MEADOW_NOTE, pictureLink("meadow.jpg", "balanced"));
    campaign.moveTo(MEADOW);
    expect(frameEl.className).toBe("dd-campaign-frame dd-tab-picture dd-tab-wash-balanced");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/meadow.jpg")');
  });

  it("drops the picture when it is deleted from the vault", () => {
    const { files, frameEl } = opened();
    files.pictures.delete("Art/harbour.jpg");
    files.fire("vault delete", "Art/harbour.jpg");
    expect(frameEl.className).toBe("dd-campaign-frame");
  });

  it("shows the picture once it is added to the vault", () => {
    const { files, frameEl } = opened();
    files.caches.set(HARBOUR_NOTE, pictureLink("cliffs.jpg", "balanced"));
    files.fire("metadata changed", HARBOUR_NOTE);
    files.pictures.add("Art/cliffs.jpg");
    files.fire("vault create", "Art/cliffs.jpg");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/cliffs.jpg")');
  });

  it("leaves the frame's style untouched when an unrelated file is added, renamed or deleted", () => {
    const { files, frameEl } = opened();
    const setCssProps = vi.spyOn(frameEl, "setCssProps");
    const removeProperty = vi.spyOn(frameEl.style, "removeProperty");
    files.fire("vault create", "Harbour Watch/Sessions/Session 2.md");
    files.fire("vault rename", "Harbour Watch/Sessions/Session 3.md");
    files.fire("vault delete", "Harbour Watch/Sessions/Session 1.md");
    expect(setCssProps).not.toHaveBeenCalled();
    expect(removeProperty).not.toHaveBeenCalled();
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/harbour.jpg")');
  });

  it("shows nothing behind the tab when the picture's address isn't one Obsidian gives on this platform", () => {
    const files = new FakeFiles();
    files.resourceRoot = "https://elsewhere.example/";
    const { frameEl } = opened(HARBOUR, files);
    expect(frameEl.className).toBe("dd-campaign-frame");
    expect(pictureOf(frameEl)).toBe("");
  });

  it("paints again when the tab opens a second time", () => {
    const { frameEl, background } = opened();
    background.unload();
    background.load();
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/harbour.jpg")');
  });

  it("clears the picture and stops listening when the tab closes", () => {
    const { files, campaign, frameEl, background } = opened();
    background.unload();
    expect(frameEl.className).toBe("dd-campaign-frame");
    expect(pictureOf(frameEl)).toBe("");
    expect(campaign.listening).toBe(0);
    expect(files.removed.sort()).toEqual(["metadata changed", "vault create", "vault delete", "vault rename"]);
  });
});
