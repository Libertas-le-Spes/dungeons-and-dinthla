import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, CachedMetadata, Plugin, TFile } from "obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import type { CampaignChoice } from "../../../src/settings/saved/campaign-choice";
import { SettingsPage } from "../../../src/settings/page/settings-page";
import { SettingsFrame } from "../../../src/obsidian/settings/settings-frame";
import { ObsidianCampaignLooks } from "../../../src/obsidian/settings/obsidian-campaign-looks";
import { PictureSuggestModal } from "../../../src/obsidian/settings/picture-suggest-modal";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { RecordedTelling } from "../../host/showing/recorded-telling";
import { CampaignsFolderSetup } from "../../../src/settings/choosing/campaigns-folder-setup";
import { FolderSuggestModal } from "../../../src/obsidian/settings/folder-suggest-modal";
import { NO_CAMPAIGN } from "../../../src/campaign/paths/campaign-folders";
import { NO_CAMPAIGNS_FOLDER } from "../../../src/fence/paths/campaigns-folder-path";
import { openedSuggestModals } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";

const PALE_MOON = "D&D/Pale Moon/Pale Moon.md";
const ASHEN_ROAD = "D&D/Ashen Road/Ashen Road.md";

function fileAt(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return { path, name, extension: name.slice(name.lastIndexOf(".") + 1) } as TFile;
}

class FakeApp {
  readonly files = [PALE_MOON, ASHEN_ROAD, "D&D/Art/pale-moon.jpg", "D&D/Art/map.png", "D&D/Art/notes.md"];
  readonly properties = new Map<string, Record<string, unknown>>([
    [PALE_MOON, {}],
    [ASHEN_ROAD, {}],
  ]);
  failWrites = false;
  readonly written: string[] = [];
  readonly telling = new RecordedTelling();
  private readonly listeners = new Set<(note: NoteRef, text: string) => void>();

  get app(): App {
    return {} as App;
  }

  get gate(): Gate {
    return {
      files: {
        getFileByPath: (path: string) => {
          if (!this.files.includes(path)) return null;
          return fileAt(path);
        },
        getFiles: () => this.files.map(fileAt),
      },
      metadata: {
        getCache: (path: string) => this.cacheOf(path),
        getFirstLinkpathDest: (linkpath: string) => {
          const path = this.files.find((file) => file.endsWith(linkpath));
          if (path === undefined) return null;
          return fileAt(path);
        },
        fileToLinktext: (file: TFile) => file.name,
      },
      fileActions: {
        processFrontMatter: async (file: TFile, change: (properties: Record<string, unknown>) => void) => {
          if (this.failWrites) throw new Error("The note is locked.");
          change(this.propertiesOf(file.path));
          this.written.push(file.path);
        },
      },
    } as unknown as Gate;
  }

  get plugin(): Plugin {
    return {} as Plugin;
  }

  get listening(): number {
    return this.listeners.size;
  }

  onRead(heard: (note: NoteRef, text: string) => void): () => void {
    this.listeners.add(heard);
    return this.listeners.delete.bind(this.listeners, heard) as () => void;
  }

  propertiesOf(path: string): Record<string, unknown> {
    const properties = this.properties.get(path);
    if (properties === undefined) throw new Error(`No note at ${path}`);
    return properties;
  }

  noteChanged(path: string): void {
    for (const listener of this.listeners) listener(fileAt(path), "");
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
    return ["D&D/Ashen Road", "D&D/Pale Moon"];
  }

  chosen(): string | null {
    return this.chosenFolder;
  }

  async choose(folder: string): Promise<void> {
    this.choices.push(folder);
    this.chosenFolder = folder;
  }
}

class FakeCampaignsFolderSetting {
  readonly chosen: string[] = [];
  failChoosing = false;

  constructor(public path: string | null) {}

  folderPaths(): string[] {
    return ["D&D", "Games", "Recipes"];
  }

  async choose(path: string): Promise<void> {
    if (this.failChoosing) throw new Error("data.json is read-only.");
    this.chosen.push(path);
    this.path = path;
  }

  async make(typed: string): Promise<string> {
    return typed;
  }
}

function tabFor(
  fake: FakeApp,
  campaigns: CampaignChoice,
  showWelcome: () => Promise<void> = async () => {},
  campaignsFolderSetting = new FakeCampaignsFolderSetting("D&D"),
): SettingsFrame {
  const pickFolder = (folders: string[], chosen: (folder: string) => void) => new FolderSuggestModal(fake.app, folders, chosen).open();
  const pickPicture = (pictures: string[], chosen: (picture: string) => void) => new PictureSuggestModal(fake.app, pictures, chosen).open();
  const setup = new CampaignsFolderSetup(campaignsFolderSetting, campaignsFolderSetting, pickFolder, fake.telling);
  const page = new SettingsPage({ campaignsFolder: setup, campaigns, looks: new ObsidianCampaignLooks(fake.gate), pickPicture, changes: fake, telling: fake.telling, showWelcome });
  const tab = new SettingsFrame(fake.app, fake.plugin, page);
  tab.containerEl = obsidianDocument().body.createDiv();
  tab.display();
  return tab;
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function rows(tab: SettingsFrame): string[] {
  return [...tab.containerEl.querySelectorAll(".setting-item-name")].map((name) => name.textContent);
}

function rowNamed(tab: SettingsFrame, name: string): HTMLElement {
  const row = [...tab.containerEl.querySelectorAll<HTMLElement>(".setting-item")].find(
    (item) => item.querySelector(".setting-item-name")!.textContent === name,
  );
  if (row === undefined) throw new Error(`No setting named ${name}`);
  return row;
}

function descriptionOf(tab: SettingsFrame, name: string): string {
  return rowNamed(tab, name).querySelector(".setting-item-description")!.textContent;
}

function pictureText(tab: SettingsFrame): string {
  return descriptionOf(tab, "Background picture");
}

function buttonIn(row: HTMLElement, text: string): HTMLButtonElement {
  const button = [...row.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

function selectIn(tab: SettingsFrame, name: string): HTMLSelectElement {
  return rowNamed(tab, name).querySelector("select")!;
}

function pick(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new select.ownerDocument.defaultView!.Event("change"));
}

describe("SettingsFrame", () => {
  let fake: FakeApp;

  beforeEach(() => {
    fake = new FakeApp();
    openedSuggestModals.length = 0;
  });

  it("asks for a campaign first when the vault has none, and still offers the welcome page", () => {
    const tab = tabFor(fake, new FakeCampaigns(null));
    expect(tab.containerEl.querySelector("p")!.textContent).toBe(NO_CAMPAIGN);
    expect(rows(tab)).toEqual(["Campaigns folder", "Welcome page"]);
  });

  it("shows the welcome page again when Show this again is pressed", () => {
    const showWelcome = vi.fn(async () => {});
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"), showWelcome);
    buttonIn(rowNamed(tab, "Welcome page"), "Show this again").click();
    expect(showWelcome).toHaveBeenCalledOnce();
  });

  it("says so when the welcome page can't be opened", async () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"), async () => {
      throw new Error("The workspace is closing.");
    });
    buttonIn(rowNamed(tab, "Welcome page"), "Show this again").click();
    await settled();
    expect(fake.telling.said).toEqual(["Couldn't open the welcome page: The workspace is closing."]);
  });

  it("shows the chosen campaign, its background picture and how much of it shows", () => {
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "strong" });
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    expect(rows(tab)).toEqual(["Campaigns folder", "Campaign", "Background picture", "How much of the picture shows", "Welcome page"]);
    expect(selectIn(tab, "Campaign").value).toBe("D&D/Pale Moon");
    expect([...selectIn(tab, "Campaign").options].map((option) => option.textContent)).toEqual(["Ashen Road", "Pale Moon"]);
    expect(pictureText(tab)).toBe("D&D/Art/pale-moon.jpg");
    expect(buttonIn(rowNamed(tab, "Background picture"), "Change picture")).toBeDefined();
    expect(buttonIn(rowNamed(tab, "Background picture"), "Remove picture").disabled).toBe(false);
    expect(selectIn(tab, "How much of the picture shows").value).toBe("strong");
  });

  it("offers to choose a picture, and has none to remove, before one is set", () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    expect(pictureText(tab)).toBe("None yet.");
    expect(buttonIn(rowNamed(tab, "Background picture"), "Choose a picture")).toBeDefined();
    expect(buttonIn(rowNamed(tab, "Background picture"), "Remove picture").disabled).toBe(true);
    expect(selectIn(tab, "How much of the picture shows").value).toBe("balanced");
  });

  it("chooses another campaign and shows its picture in the same rows", async () => {
    fake.properties.set(ASHEN_ROAD, { background: "[[map.png]]", wash: "subtle" });
    const campaigns = new FakeCampaigns("D&D/Pale Moon");
    const tab = tabFor(fake, campaigns);
    const washSelect = selectIn(tab, "How much of the picture shows");
    pick(selectIn(tab, "Campaign"), "D&D/Ashen Road");
    await settled();
    expect(campaigns.choices).toEqual(["D&D/Ashen Road"]);
    expect(pictureText(tab)).toBe("D&D/Art/map.png");
    expect(selectIn(tab, "How much of the picture shows")).toBe(washSelect);
    expect(washSelect.value).toBe("subtle");
  });

  it("offers only the pictures it is handed, and links the one chosen in the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Choose a picture").click();
    const modal = openedSuggestModals[0] as PictureSuggestModal;
    expect(modal.getItems()).toEqual(["D&D/Art/pale-moon.jpg", "D&D/Art/map.png"]);
    modal.onChooseItem("D&D/Art/map.png");
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ background: "[[map.png]]" });
    expect(fake.written).toEqual([PALE_MOON]);
  });

  it("writes to the campaign chosen since the page opened", async () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    pick(selectIn(tab, "Campaign"), "D&D/Ashen Road");
    await settled();
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(fake.written).toEqual([ASHEN_ROAD]);
  });

  it("removes the picture from the main note", async () => {
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "subtle" });
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    buttonIn(rowNamed(tab, "Background picture"), "Remove picture").click();
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ wash: "subtle" });
  });

  it("writes how much of the picture shows to the main note", async () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    pick(selectIn(tab, "How much of the picture shows"), "subtle");
    await settled();
    expect(fake.propertiesOf(PALE_MOON)).toEqual({ wash: "subtle" });
  });

  it("says so when the main note can't be written", async () => {
    fake.failWrites = true;
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(fake.telling.said).toEqual(["Couldn't save the campaign: The note is locked."]);
  });

  it("says so, and writes nothing, when the main note has gone", async () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    fake.files.splice(fake.files.indexOf(PALE_MOON), 1);
    pick(selectIn(tab, "How much of the picture shows"), "strong");
    await settled();
    expect(fake.telling.said).toEqual(["Couldn't save the campaign: D&D/Pale Moon/Pale Moon.md is missing."]);
    expect(fake.written).toEqual([]);
  });

  it("updates the rows in place once Obsidian has read the main note", () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    const washSelect = selectIn(tab, "How much of the picture shows");
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]", wash: "strong" });
    fake.noteChanged(PALE_MOON);
    expect(pictureText(tab)).toBe("D&D/Art/pale-moon.jpg");
    expect(selectIn(tab, "How much of the picture shows")).toBe(washSelect);
    expect(washSelect.value).toBe("strong");
  });

  it("stays as it is when another note changes", () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]" });
    fake.noteChanged(ASHEN_ROAD);
    expect(pictureText(tab)).toBe("None yet.");
  });

  it("stays as it is once the settings close", () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    tab.hide();
    fake.properties.set(PALE_MOON, { background: "[[pale-moon.jpg]]" });
    fake.noteChanged(PALE_MOON);
    expect(pictureText(tab)).toBe("None yet.");
  });

  it("shows the Campaigns folder set, and says the plugin touches nothing while none is", () => {
    const set = tabFor(fake, new FakeCampaigns(null), async () => {}, new FakeCampaignsFolderSetting("Games/D&D"));
    const unset = tabFor(fake, new FakeCampaigns(null), async () => {}, new FakeCampaignsFolderSetting(null));
    expect(descriptionOf(set, "Campaigns folder")).toMatch(/Now: Games\/D&D$/);
    expect(descriptionOf(unset, "Campaigns folder").endsWith(` ${NO_CAMPAIGNS_FOLDER}`)).toBe(true);
  });

  it("offers every folder to pick from, sets the one picked and shows it", async () => {
    const folder = new FakeCampaignsFolderSetting(null);
    const tab = tabFor(fake, new FakeCampaigns(null), async () => {}, folder);
    buttonIn(rowNamed(tab, "Campaigns folder"), "Choose folder").click();
    const modal = openedSuggestModals[0] as FolderSuggestModal;
    expect(modal.getItems()).toEqual(["D&D", "Games", "Recipes"]);
    modal.onChooseItem("Games");
    await settled();
    expect(folder.chosen).toEqual(["Games"]);
    expect(descriptionOf(tab, "Campaigns folder")).toMatch(/Now: Games$/);
  });

  it("says so when the Campaigns folder can't be set", async () => {
    const folder = new FakeCampaignsFolderSetting(null);
    folder.failChoosing = true;
    const tab = tabFor(fake, new FakeCampaigns(null), async () => {}, folder);
    buttonIn(rowNamed(tab, "Campaigns folder"), "Choose folder").click();
    (openedSuggestModals[0] as FolderSuggestModal).onChooseItem("Games");
    await settled();
    expect(fake.telling.said).toEqual(["Couldn't set the Campaigns folder: data.json is read-only."]);
  });

  it("listens for the main note only while the settings are open, once however often they are drawn", () => {
    const tab = tabFor(fake, new FakeCampaigns("D&D/Pale Moon"));
    tab.display();
    expect(fake.listening).toBe(1);
    tab.hide();
    expect(fake.listening).toBe(0);
  });
});
