import { describe, expect, it, vi } from "vitest";
import type { PluginSettings } from "../../src/settings/plugin-settings";
import { Help, type HelpFiles } from "../../src/welcome/help";
import type { NewsItem } from "../../src/whats-new/news-item";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };
const MADE_UP_NEWS = new Map<string, NewsItem>([["3.1.0", LANTERNS]]);
const FRESH: PluginSettings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };

function helpFor(settings: PluginSettings, paths: string[]) {
  const saved: PluginSettings[] = [];
  async function save(changed: PluginSettings): Promise<void> {
    saved.push({ ...changed });
  }
  const vault: HelpFiles = { campaignFolders: () => ["Silver Road"], filePaths: () => paths };
  const openWelcome = vi.fn(async () => {});
  const help = new Help({ ...settings }, { version: "3.1.0" }, MADE_UP_NEWS, save, vault, openWelcome);
  return { help, saved, openWelcome };
}

describe("Help", () => {
  it("opens the welcome page on a fresh install, counting the plugin's own version as seen", async () => {
    const { help, saved, openWelcome } = helpFor(FRESH, ["Silver Road/Silver Road.md"]);
    await help.start();
    expect(openWelcome).toHaveBeenCalledOnce();
    expect(saved).toEqual([{ campaignsFolder: null, campaignFolder: null, welcomeSeen: true, lastVersionSeen: "3.1.0" }]);
  });

  it("takes a vault whose campaign already has a session note for an update: no welcome, and the news still to see", async () => {
    const { help, saved, openWelcome } = helpFor(FRESH, ["Silver Road/Silver Road.md", "Silver Road/Sessions/Session 1.md"]);
    await help.start();
    expect(openWelcome).not.toHaveBeenCalled();
    expect(saved).toEqual([{ campaignsFolder: null, campaignFolder: null, welcomeSeen: true, lastVersionSeen: null }]);
    expect(help.whatsNew.latest()).toEqual(LANTERNS);
  });

  it("reads the news of the plugin's own version", () => {
    const { help } = helpFor({ ...FRESH, welcomeSeen: true, lastVersionSeen: "3.0.0" }, []);
    expect(help.whatsNew.latest()).toEqual(LANTERNS);
  });

  it("opens the welcome page again when asked", async () => {
    const { help, openWelcome } = helpFor({ ...FRESH, welcomeSeen: true }, []);
    await help.showWelcome();
    expect(openWelcome).toHaveBeenCalledOnce();
  });
});
