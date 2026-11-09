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
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignFolder: null, welcomeSeen: false, lastVersionSeen: null });
    await firstRun.begin(false, showWelcome);
    expect(showWelcome).toHaveBeenCalledOnce();
    expect(saved).toEqual([{ campaignFolder: null, welcomeSeen: true, lastVersionSeen: VERSION }]);
  });

  it("skips the welcome for a vault upgraded from before it, whose campaign already has sessions, leaving the news unseen", async () => {
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignFolder: "Silver Road", welcomeSeen: false, lastVersionSeen: null });
    await firstRun.begin(true, showWelcome);
    expect(showWelcome).not.toHaveBeenCalled();
    expect(saved).toEqual([{ campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen: null }]);
  });

  it("shows nothing and saves nothing once the welcome was seen", async () => {
    const { firstRun, saved, showWelcome } = firstRunWith({ campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen: "1.3.0" });
    await firstRun.begin(false, showWelcome);
    expect(showWelcome).not.toHaveBeenCalled();
    expect(saved).toEqual([]);
  });

  it("saves before showing the welcome, so a failed page still never shows it twice", async () => {
    const order: string[] = [];
    const settings = { campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
    const firstRun = new FirstRun(settings, VERSION, async () => void order.push("saved"));
    await firstRun.begin(false, async () => void order.push("shown"));
    expect(order).toEqual(["saved", "shown"]);
  });
});
