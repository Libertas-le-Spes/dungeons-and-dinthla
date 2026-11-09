import { describe, expect, it, vi } from "vitest";
import type { PluginSettings } from "../../src/settings/plugin-settings";
import { FirstRun } from "../../src/welcome/first-run";

const VERSION = "1.4.0";

function firstRunWith(settings: PluginSettings) {
  const saved: PluginSettings[] = [];
  const save = async (changed: PluginSettings) => {
    saved.push({ ...changed });
  };
  const showWelcome = vi.fn(async () => {});
  return { firstRun: new FirstRun(settings, VERSION, save), saved, showWelcome };
}

describe("FirstRun", () => {
  it("shows the welcome on a fresh install, and marks it and this version's news seen", async () => {
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null });
    await firstRun.begin(false, showWelcome);
    expect(showWelcome).toHaveBeenCalledOnce();
    expect(saved).toEqual([{ campaignsFolder: null, campaignFolder: null, welcomeSeen: true, lastVersionSeen: VERSION }]);
  });

  it("skips the welcome for a vault upgraded from before it, whose campaign already has sessions, leaving the news unseen", async () => {
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignsFolder: null, campaignFolder: "Silver Road", welcomeSeen: false, lastVersionSeen: null });
    await firstRun.begin(true, showWelcome);
    expect(showWelcome).not.toHaveBeenCalled();
    expect(saved).toEqual([{ campaignsFolder: null, campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen: null }]);
  });

  it("shows nothing and saves nothing once the welcome was seen", async () => {
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignsFolder: null, campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen: "1.3.0" });
    await firstRun.begin(false, showWelcome);
    expect(showWelcome).not.toHaveBeenCalled();
    expect(saved).toEqual([]);
  });

  it("shows no welcome when the settings can't be saved, so it can't show on every start", async () => {
    const settings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
    const failingSave = async () => {
      throw new Error("data.json is read-only.");
    };
    const showWelcome = vi.fn(async () => {});
    const firstRun = new FirstRun(settings, VERSION, failingSave);
    await expect(firstRun.begin(false, showWelcome)).rejects.toThrow("data.json is read-only.");
    expect(showWelcome).not.toHaveBeenCalled();
  });

  it("keeps the welcome seen when the page fails to open, so the next start doesn't show it again", async () => {
    const { firstRun, saved } = firstRunWith({ campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null });
    const failingWelcome = async () => {
      throw new Error("The workspace is closing.");
    };
    await expect(firstRun.begin(false, failingWelcome)).rejects.toThrow("The workspace is closing.");
    const [savedSettings] = saved;
    const nextStart = firstRunWith({ ...savedSettings! });
    await nextStart.firstRun.begin(false, nextStart.showWelcome);
    expect(nextStart.showWelcome).not.toHaveBeenCalled();
  });

  it("saves before showing the welcome", async () => {
    const order: string[] = [];
    const settings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
    async function save(): Promise<void> {
      order.push("saved");
    }
    async function showWelcome(): Promise<void> {
      order.push("shown");
    }
    await new FirstRun(settings, VERSION, save).begin(false, showWelcome);
    expect(order).toEqual(["saved", "shown"]);
  });
});
