import { describe, expect, it, vi } from "vitest";
import type { PluginSettings } from "../../src/settings/plugin-settings";
import { Help, type HelpVault } from "../../src/welcome/help";
import type { NewsItem } from "../../src/whats-new/news-item";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };
const MADE_UP_NEWS = new Map<string, NewsItem>([["3.1.0", LANTERNS]]);
const FRESH: PluginSettings = { campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };

function helpFor(settings: PluginSettings, paths: string[]) {
  const saved: PluginSettings[] = [];
  async function save(changed: PluginSettings): Promise<void> {
    saved.push({ ...changed });
  }
  const vault: HelpVault = { campaignFolders: () => ["Silver Road"], filePaths: () => paths };
  const openPage = vi.fn(async () => {});
  const help = new Help({ ...settings }, { version: "3.1.0" }, MADE_UP_NEWS, save, vault, openPage);
  return { help, saved, openPage };
}

describe("Help", () => {
  it("opens the welcome page on a fresh install, counting the plugin's own version as seen", async () => {
    const { help, saved, openPage } = helpFor(FRESH, ["Silver Road/Silver Road.md"]);
    await help.start();
    expect(openPage).toHaveBeenCalledExactlyOnceWith("welcome");
    expect(saved).toEqual([{ campaignFolder: null, welcomeSeen: true, lastVersionSeen: "3.1.0" }]);
  });

  it("takes a vault whose campaign already has a session note for an update: no welcome, and the news still to see", async () => {
    const { help, saved, openPage } = helpFor(FRESH, ["Silver Road/Silver Road.md", "Silver Road/Sessions/Session 1.md"]);
    await help.start();
    expect(openPage).not.toHaveBeenCalled();
    expect(saved).toEqual([{ campaignFolder: null, welcomeSeen: true, lastVersionSeen: null }]);
    expect(help.whatsNew.latest()).toEqual(LANTERNS);
  });

  it("reads the news of the plugin's own version", () => {
    const { help } = helpFor({ ...FRESH, welcomeSeen: true, lastVersionSeen: "3.0.0" }, []);
    expect(help.whatsNew.latest()).toEqual(LANTERNS);
  });

  it("opens the welcome page again when asked", async () => {
    const { help, openPage } = helpFor({ ...FRESH, welcomeSeen: true }, []);
    await help.showWelcome();
    expect(openPage).toHaveBeenCalledExactlyOnceWith("welcome");
  });
});
