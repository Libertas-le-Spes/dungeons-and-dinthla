import { beforeEach, describe, expect, it } from "vitest";
import { CampaignSwitcher, NEW_CAMPAIGN_ENTRY, SWITCH_LABEL } from "../../../src/interface/view/campaign-switcher";
import { Menu, Notice } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";

class FakeCampaigns {
  readonly choices: string[] = [];
  newCampaigns = 0;
  failure: Error | null = null;

  constructor(
    public listed: string[],
    public current: string | null,
  ) {}

  folders(): string[] {
    return this.listed;
  }

  chosen(): string | null {
    return this.current;
  }

  async choose(folder: string): Promise<void> {
    if (this.failure !== null) throw this.failure;
    this.choices.push(folder);
    this.current = folder;
  }

  startNewCampaign(): void {
    this.newCampaigns += 1;
  }
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function switcherFor(campaigns: FakeCampaigns): HTMLElement {
  const parentEl = obsidianDocument().createElement("div");
  new CampaignSwitcher({ parentEl, campaigns }).load();
  return parentEl.querySelector<HTMLElement>("button")!;
}

function pressed(button: HTMLElement): Menu {
  Menu.shown = [];
  button.click();
  return Menu.shown[0]!;
}

function titles(menu: Menu): string[] {
  return menu.items.map((item) => item.title);
}

function itemTitled(menu: Menu, title: string) {
  return menu.items.find((item) => item.title === title)!;
}

describe("CampaignSwitcher", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("is a labelled icon button that says it opens a menu", () => {
    const button = switcherFor(new FakeCampaigns([], null));
    expect(button.tagName).toBe("BUTTON");
    expect(button.classList.contains("clickable-icon")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe(SWITCH_LABEL);
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("data-icon")).toBe("chevrons-up-down");
  });

  it("lists the campaigns by name with the current one marked, and New campaign last after a separator", () => {
    const menu = pressed(switcherFor(new FakeCampaigns(["D&D/Ashen Road", "D&D/Pale Moon"], "D&D/Pale Moon")));
    expect(titles(menu)).toEqual(["Ashen Road", "Pale Moon", "", NEW_CAMPAIGN_ENTRY]);
    expect(menu.items.map((item) => item.checked)).toEqual([false, true, false, false]);
    expect(menu.items[2]!.separator).toBe(true);
    expect(itemTitled(menu, NEW_CAMPAIGN_ENTRY).icon).toBe("plus");
  });

  it("opens the menu under the button", () => {
    expect(pressed(switcherFor(new FakeCampaigns([], null))).position).toEqual({ x: 0, y: 0 });
  });

  it("offers only New campaign, with no separator, when there are no campaigns", () => {
    expect(titles(pressed(switcherFor(new FakeCampaigns([], null))))).toEqual([NEW_CAMPAIGN_ENTRY]);
  });

  it("lists a single campaign marked, then New campaign", () => {
    const menu = pressed(switcherFor(new FakeCampaigns(["D&D/Pale Moon"], "D&D/Pale Moon")));
    expect(titles(menu)).toEqual(["Pale Moon", "", NEW_CAMPAIGN_ENTRY]);
  });

  it("chooses the campaign pressed", async () => {
    const campaigns = new FakeCampaigns(["D&D/Ashen Road", "D&D/Pale Moon"], "D&D/Pale Moon");
    itemTitled(pressed(switcherFor(campaigns)), "Ashen Road").click();
    await settled();
    expect(campaigns.choices).toEqual(["D&D/Ashen Road"]);
  });

  it("chooses nothing when the campaign pressed is already the current one, even if it became current while the menu was open", async () => {
    const campaigns = new FakeCampaigns(["D&D/Ashen Road", "D&D/Pale Moon"], "D&D/Pale Moon");
    const menu = pressed(switcherFor(campaigns));
    campaigns.current = "D&D/Ashen Road";
    itemTitled(menu, "Ashen Road").click();
    await settled();
    expect(campaigns.choices).toEqual([]);
    expect(Notice.shown).toEqual([]);
  });

  it("says so, and chooses nothing, when the campaign pressed was removed while the menu was open", async () => {
    const campaigns = new FakeCampaigns(["D&D/Ashen Road", "D&D/Pale Moon"], "D&D/Pale Moon");
    const menu = pressed(switcherFor(campaigns));
    campaigns.listed = ["D&D/Pale Moon"];
    itemTitled(menu, "Ashen Road").click();
    await settled();
    expect(campaigns.choices).toEqual([]);
    expect(Notice.shown).toEqual(["Couldn't switch campaign: Ashen Road is no longer there."]);
  });

  it("says why when choosing fails", async () => {
    const campaigns = new FakeCampaigns(["D&D/Ashen Road", "D&D/Pale Moon"], "D&D/Pale Moon");
    campaigns.failure = new Error("The settings can't be saved.");
    itemTitled(pressed(switcherFor(campaigns)), "Ashen Road").click();
    await settled();
    expect(Notice.shown).toEqual(["Couldn't switch campaign: The settings can't be saved."]);
  });

  it("starts a new campaign from New campaign, whether or not there are campaigns", () => {
    const none = new FakeCampaigns([], null);
    itemTitled(pressed(switcherFor(none)), NEW_CAMPAIGN_ENTRY).click();
    const some = new FakeCampaigns(["D&D/Pale Moon"], "D&D/Pale Moon");
    itemTitled(pressed(switcherFor(some)), NEW_CAMPAIGN_ENTRY).click();
    expect([none.newCampaigns, some.newCampaigns]).toEqual([1, 1]);
  });

  it("reads the campaigns again each time it is pressed", () => {
    const campaigns = new FakeCampaigns(["D&D/Pale Moon"], "D&D/Pale Moon");
    const button = switcherFor(campaigns);
    pressed(button);
    campaigns.listed = ["D&D/Ashen Road", "D&D/Pale Moon"];
    expect(titles(pressed(button))).toEqual(["Ashen Road", "Pale Moon", "", NEW_CAMPAIGN_ENTRY]);
  });
});
