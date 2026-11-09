import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, CachedMetadata, EventRef, Plugin, TFile } from "obsidian";
import { CampaignSettingTab, type CampaignChoice } from "../../src/settings/campaign-setting-tab";
import type { PictureSuggestModal } from "../../src/settings/picture-suggest-modal";
import { Notice, openedSuggestModals } from "../stubs/obsidian";
import { obsidianDocument } from "../views/obsidian-dom";

const PALE_MOON = "Pale Moon/Pale Moon.md";
const ASHEN_ROAD = "Ashen Road/Ashen Road.md";

function fileAt(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return { path, name, extension: name.slice(name.lastIndexOf(".") + 1) } as TFile;
}

class FakeApp {
  readonly files = [PALE_MOON, ASHEN_ROAD, "Art/pale-moon.jpg", "Art/map.png", "Art/notes.md"];
  readonly properties = new Map<string, Record<string, unknown>>([
    [PALE_MOON, {}],
    [ASHEN_ROAD, {}],
  ]);
  failWrites = false;
  readonly written: string[] = [];
  readonly registered: EventRef[] = [];
  private readonly listeners: ((file: TFile) => void)[] = [];

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
        getCache: (path: string) => this.cacheOf(path),
        getFirstLinkpathDest: (linkpath: string) => {
          const path = this.files.find((file) => file.endsWith(linkpath));
          if (path === undefined) return null;
          return fileAt(path);
        },
        fileToLinktext: (file: TFile) => file.name,
        on: (_name: string, callback: (file: TFile) => void) => {
          this.listeners.push(callback);
          return {} as EventRef;
        },
      },
      fileManager: {
        processFrontMatter: async (file: TFile, change: (properties: Record<string, unknown>) => void) => {
          if (this.failWrites) throw new Error("The note is locked.");
          change(this.propertiesOf(file.path));
          this.written.push(file.path);
        },
      },
    } as unknown as App;
  }

  get plugin(): Plugin {
    return { registerEvent: (ref: EventRef) => this.registered.push(ref) } as unknown as Plugin;
  }

  propertiesOf(path: string): Record<string, unknown> {
    const properties = this.properties.get(path);
    if (properties === undefined) throw new Error(`No note at ${path}`);
    return properties;
  }

  noteChanged(path: string): void {
    for (const listener of this.listeners) listener(fileAt(path));
  }

  private cacheOf(path: string): CachedMetadata | null {
    const properties = this.properties.get(path);
    if (properties === undefined) return null;
    const cache: CachedMetadata = { frontmatter: { ...properties } };
    const background = properties.background;
    if (typeof background === "string") {
      const link = background.slice(2, -2);
      cache.frontmatterLinks = [{ key: "background", link, original: background }];
    }
    return cache;
  }
}

class FakeCampaigns implements CampaignChoice {
  readonly choices: string[] = [];

  constructor(private chosenFolder: string | null) {}

  folders(): string[] {
    if (this.chosenFolder === null) return [];
    return ["Ashen Road", "Pale Moon"];
  }

  chosen(): string | null {
    return this.chosenFolder;
  }

  async choose(folder: string): Promise<void> {
    this.choices.push(folder);
    this.chosenFolder = folder;
  }
}

function tabFor(fake: FakeApp, campaigns: CampaignChoice, showWelcome: () => Promise<void> = async () => {}): CampaignSettingTab {
  const tab = new CampaignSettingTab(fake.app, fake.plugin, campaigns, showWelcome);
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

function pictureText(tab: CampaignSettingTab): string {
  return rowNamed(tab, "Background picture").querySelector(".setting-item-description")!.textContent;
}

function buttonIn(row: HTMLElement, text: string): HTMLButtonElement {
  const button = [...row.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

function selectIn(tab: CampaignSettingTab, name: string): HTMLSelectElement {
  return rowNamed(tab, name).querySelector("select")!;
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

  it("asks for a campaign first when the vault has none, and still offers the welcome page", () => {
    const tab = tabFor(fake, new FakeCampaigns(null));
    expect(tab.containerEl.querySelector("p")!.textContent).toBe("Make a campaign first: a top-level folder with a main note of the same name.");
    expect(rows(tab)).toEqual(["Welcome page"]);
  });

  it("shows the welcome page again when Show this again is pressed", () => {
    const showWelcome = vi.fn(async () => {});
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"), showWelcome);
    buttonIn(rowNamed(tab, "Welcome page"), "Show this again").click();
    expect(showWelcome).toHaveBeenCalledOnce();
  });

  it("says so when the welcome page can't be opened", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"), async () => {
      throw new Error("The workspace is closing.");
    });
    buttonIn(rowNamed(tab, "Welcome page"), "Show this again").click();
    await settled();
    expect(Notice.shown).toEqual(["Couldn't open the welcome page: The workspace is closing."]);
  });

  it("shows the chosen campaign, its background picture and how much of it shows", () => {
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "strong" });
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    expect(rows(tab)).toEqual(["Campaign", "Background picture", "How much of the picture shows", "Welcome page"]);
    expect(selectIn(tab, "Campaign").value).toBe("Pale Moon");
    expect(pictureText(tab)).toBe("Art/pale-moon.jpg");
    expect(buttonIn(rowNamed(tab, "Background picture"), "Change picture")).toBeDefined();
    expect(buttonIn(rowNamed(tab, "Background picture"), "Remove picture").disabled).toBe(false);
    expect(selectIn(tab, "How much of the picture shows").value).toBe("strong");
  });

  it("offers to choose a picture, and has none to remove, before one is set", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    expect(pictureText(tab)).toBe("None yet.");
    expect(buttonIn(rowNamed(tab, "Background picture"), "Choose a picture")).toBeDefined();
    expect(buttonIn(rowNamed(tab, "Background picture"), "Remove picture").disabled).toBe(true);
    expect(selectIn(tab, "How much of the picture shows").value).toBe("balanced");
  });

  it("chooses another campaign and shows its picture in the same rows", async () => {
    fake.properties.set(ASHEN_ROAD, { background: "[[map.png]]", wash: "subtle" });
    const campaigns = new FakeCampaigns("Pale Moon");
    const tab = tabFor(fake, campaigns);
    const washSelect = selectIn(tab, "How much of the picture shows");
    pick(selectIn(tab, "Campaign"), "Ashen Road");
    await settled();
    expect(campaigns.choices).toEqual(["Ashen Road"]);
    expect(pictureText(tab)).toBe("Art/map.png");
    expect(selectIn(tab, "How much of the picture shows")).toBe(washSelect);
    expect(washSelect.value).toBe("subtle");
  });

  it("offers only the vault's pictures, and links the one chosen in the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Choose a picture").click();
    const modal = openedSuggestModals[0] as PictureSuggestModal;
    expect(modal.getItems().map((picture) => picture.path)).toEqual(["Art/pale-moon.jpg", "Art/map.png"]);
    modal.onChooseItem(fileAt("Art/map.png"));
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ background: "[[map.png]]" });
    expect(fake.written).toEqual([PALE_MOON]);
  });

  it("writes to the campaign chosen since the page opened", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    pick(selectIn(tab, "Campaign"), "Ashen Road");
    await settled();
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(fake.written).toEqual([ASHEN_ROAD]);
  });

  it("removes the picture from the main note", async () => {
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "subtle" });
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Remove picture").click();
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ wash: "subtle" });
  });

  it("writes how much of the picture shows to the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    pick(selectIn(tab, "How much of the picture shows"), "subtle");
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ wash: "subtle" });
  });

  it("says so when the main note can't be written", async () => {
    fake.failWrites = true;
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't save the campaign: The note is locked."]);
  });

  it("says so, and writes nothing, when the main note has gone", async () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    fake.files.splice(fake.files.indexOf(PALE_MOON), 1);
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't save the campaign: Pale Moon/Pale Moon.md is missing."]);
    expect(fake.written).toEqual([]);
  });

  it("updates the rows in place once Obsidian has read the main note", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    const washSelect = selectIn(tab, "How much of the picture shows");
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "strong" });
    fake.noteChanged(PALE_MOON);
    expect(pictureText(tab)).toBe("Art/pale-moon.jpg");
    expect(selectIn(tab, "How much of the picture shows")).toBe(washSelect);
    expect(washSelect.value).toBe("strong");
  });

  it("stays as it is when another note changes", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]" });
    fake.noteChanged(ASHEN_ROAD);
    expect(pictureText(tab)).toBe("None yet.");
  });

  it("stays as it is once the settings close", () => {
    const tab = tabFor(fake, new FakeCampaigns("Pale Moon"));
    tab.hide();
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]" });
    fake.noteChanged(PALE_MOON);
    expect(pictureText(tab)).toBe("None yet.");
  });

  it("listens to Obsidian through the plugin, so it stops when the plugin unloads", () => {
    tabFor(fake, new FakeCampaigns("Pale Moon"));
    expect(fake.registered).toHaveLength(1);
  });
});
