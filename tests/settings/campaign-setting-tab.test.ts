import { beforeEach, describe, expect, it } from "vitest";
import type { App, CachedMetadata, EventRef, Plugin, TFile } from "obsidian";
import { CampaignSettingTab, type CampaignChoice } from "../../src/settings/campaign-setting-tab";
import type { PictureSuggestModal } from "../../src/settings/picture-suggest-modal";
import { Notice, openedSuggestModals } from "../stubs/obsidian";
import { obsidianDocument } from "../views/obsidian-dom";

const PALE_MOON = "Pale Moon/Pale Moon.md";

function fileAt(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return { path, name, extension: name.slice(name.lastIndexOf(".") + 1) } as TFile;
}

class FakeApp {
  readonly files = [PALE_MOON, "Ashen Road/Ashen Road.md", "Art/pale-moon.jpg", "Art/map.png", "Art/notes.md"];
  properties: Record<string, unknown> = {};
  failWrites = false;
  readonly written: string[] = [];
  private readonly listeners = new Map<EventRef, (file: TFile) => void>();

  get app(): App {
    return {
      vault: {
        getFileByPath: (path: string) => {
          if (!this.files.includes(path)) return null;
          return fileAt(path);
        },
        getFiles: () => this.files.map(fileAt),
      },
      metadataCache: {
        getCache: (path: string) => {
          if (path !== PALE_MOON) return null;
          return this.cache();
        },
        getFirstLinkpathDest: (linkpath: string) => {
          const path = this.files.find((file) => file.endsWith(linkpath));
          if (path === undefined) return null;
          return fileAt(path);
        },
        fileToLinktext: (file: TFile) => file.name,
        on: (_name: string, callback: (file: TFile) => void) => {
          const ref = {} as EventRef;
          this.listeners.set(ref, callback);
          return ref;
        },
        offref: (ref: EventRef) => {
          if (!this.listeners.delete(ref)) throw new Error("Nothing is watching with that ref.");
        },
      },
      fileManager: {
        processFrontMatter: async (file: TFile, change: (properties: Record<string, unknown>) => void) => {
          if (this.failWrites) throw new Error("The note is locked.");
          change(this.properties);
          this.written.push(file.path);
        },
      },
    } as unknown as App;
  }

  noteChanged(path: string): void {
    for (const listener of [...this.listeners.values()]) listener(fileAt(path));
  }

  get watchers(): number {
    return this.listeners.size;
  }

  private cache(): CachedMetadata {
    const cache: CachedMetadata = { frontmatter: { ...this.properties } };
    const background = this.properties.background;
    if (typeof background === "string") {
      const link = background.slice(2, -2);
      cache.frontmatterLinks = [{ key: "background", link, original: background }];
    }
    return cache;
  }
}

class FakeCampaigns implements CampaignChoice {
  readonly chosen: string[] = [];

  constructor(private shownFolder: string | null) {}

  folders(): string[] {
    if (this.shownFolder === null) return [];
    return ["Ashen Road", "Pale Moon"];
  }

  shown(): string | null {
    return this.shownFolder;
  }

  async choose(folder: string): Promise<void> {
    this.chosen.push(folder);
    this.shownFolder = folder;
  }
}

function tabFor(fake: FakeApp, campaigns: CampaignChoice): CampaignSettingTab {
  const tab = new CampaignSettingTab(fake.app, {} as Plugin, campaigns);
  tab.containerEl = obsidianDocument().body.createDiv();
  tab.display();
  return tab;
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function rows(tab: CampaignSettingTab): string[] {
  return [...tab.containerEl.querySelectorAll(".setting-item-name")].map((name) => name.textContent);
}

function rowNamed(tab: CampaignSettingTab, name: string): HTMLElement {
  const row = [...tab.containerEl.querySelectorAll<HTMLElement>(".setting-item")].find(
    (item) => item.querySelector(".setting-item-name")!.textContent === name,
  );
  if (row === undefined) throw new Error(`No setting named ${name}`);
  return row;
}

function buttonIn(row: HTMLElement, text: string): HTMLButtonElement {
  const button = [...row.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

function pick(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new select.ownerDocument.defaultView!.Event("change"));
}

describe("CampaignSettingTab", () => {
  let fake: FakeApp;

  beforeEach(() => {
    fake = new FakeApp();
    openedSuggestModals.length = 0;
    Notice.shown = [];
  });

  it("asks for a campaign first when the vault has none", () => {
    const tab = tabFor(fake, new FakeCampaigns(null));
    expect(tab.containerEl.textContent).toBe("Make a campaign first: a top-level folder with a main note of the same name.");
  });

  it("shows the campaign's folder, its background picture and how much of it shows", () => {
    fake.properties = { background: "[[pale-moon.jpg]]", wash: "strong" };
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    expect(rows(tab)).toEqual(["Campaign", "Background picture", "How much of the picture shows"]);
    expect(rowNamed(tab, "Campaign").querySelector("select")!.value).toBe("Pale Moon");
    expect(rowNamed(tab, "Background picture").querySelector(".setting-item-description")!.textContent).toBe("Art/pale-moon.jpg");
    expect(buttonIn(rowNamed(tab, "Background picture"), "Remove picture").disabled).toBe(false);
    expect(rowNamed(tab, "How much of the picture shows").querySelector("select")!.value).toBe("strong");
  });

  it("offers to choose a picture, and has none to remove, before one is set", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    const row = rowNamed(tab, "Background picture");
    expect(row.querySelector(".setting-item-description")!.textContent).toBe("None yet.");
    expect(buttonIn(row, "Choose a picture")).toBeDefined();
    expect(buttonIn(row, "Remove picture").disabled).toBe(true);
    expect(rowNamed(tab, "How much of the picture shows").querySelector("select")!.value).toBe("balanced");
  });

  it("opens the chosen campaign, remembers it and shows its settings", async () => {
    const campaigns = new FakeCampaigns("Pale Moon");
    const tab = tabFor(fake, campaigns);
    pick(rowNamed(tab, "Campaign").querySelector("select")!, "Ashen Road");
    await settled();
    expect(campaigns.chosen).toEqual(["Ashen Road"]);
    expect(rowNamed(tab, "Campaign").querySelector("select")!.value).toBe("Ashen Road");
  });

  it("shows only the campaign when its main note has gone missing", () => {
    const tab = tabFor(fake, new FakeCampaigns("Lost Mines"));
    expect(rows(tab)).toEqual(["Campaign"]);
    expect(fake.watchers).toBe(0);
  });

  it("offers only the vault's pictures, and links the one chosen in the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Choose a picture").click();
    const modal = openedSuggestModals[0] as PictureSuggestModal;
    expect(modal.getItems().map((picture) => picture.path)).toEqual(["Art/pale-moon.jpg", "Art/map.png"]);
    modal.onChooseItem(fileAt("Art/map.png"));
    await settled();
    expect(fake.properties).toEqual({ background: "[[map.png]]" });
    expect(fake.written).toEqual([PALE_MOON]);
  });

  it("removes the picture from the main note", async () => {
    fake.properties = { background: "[[pale-moon.jpg]]", wash: "subtle" };
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Remove picture").click();
    await settled();
    expect(fake.properties).toEqual({ wash: "subtle" });
  });

  it("writes how much of the picture shows to the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    pick(rowNamed(tab, "How much of the picture shows").querySelector("select")!, "subtle");
    await settled();
    expect(fake.properties).toEqual({ wash: "subtle" });
  });

  it("says so when the main note can't be written", async () => {
    fake.failWrites = true;
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    pick(rowNamed(tab, "How much of the picture shows").querySelector("select")!, "strong");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't save the campaign: The note is locked."]);
  });

  it("shows the main note's new properties once Obsidian has read them", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    fake.properties = { background: "[[pale-moon.jpg]]" };
    fake.noteChanged(PALE_MOON);
    expect(rowNamed(tab, "Background picture").querySelector(".setting-item-description")!.textContent).toBe("Art/pale-moon.jpg");
    expect(fake.watchers).toBe(1);
  });

  it("stays as it is when another note changes", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    const before = rowNamed(tab, "Background picture");
    fake.noteChanged("Ashen Road/Ashen Road.md");
    expect(rowNamed(tab, "Background picture")).toBe(before);
  });

  it("stops watching the main note once the settings close", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    tab.hide();
    expect(fake.watchers).toBe(0);
  });

  it("closes without trouble when it was never watching", () => {
    const tab = tabFor(fake, new FakeCampaigns(null));
    expect(() => tab.hide()).not.toThrow();
  });
});
