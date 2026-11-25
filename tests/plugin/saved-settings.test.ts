import { describe, expect, it, vi } from "vitest";
import { SavedSettings } from "../../src/plugin/saved-settings";
import { MOVED_KEY } from "../../src/settings/drafts/old-drafts";
import type { LocalDrafts } from "../../src/settings/drafts/local-drafts";
import type { KeptDrafts } from "../../src/session-notes/kept/kept-drafts";
import { RecordedTelling } from "../host/showing/recorded-telling";

const SETTINGS_FOLDER = "Vault Settings";
const ONE = "D&D/Pale Moon/Sessions/Session 1.md";

class MadeUpData {
  readonly written: unknown[] = [];
  failWrites = false;

  constructor(private readonly saved: unknown) {}

  async load(): Promise<unknown> {
    return this.saved;
  }

  async save(data: unknown): Promise<void> {
    if (this.failWrites) throw new Error("data.json is read-only.");
    this.written.push(data);
  }
}

class MadeUpDevice {
  readonly kept = new Map<string, unknown>();

  load(key: string): unknown {
    return this.kept.get(key);
  }

  save(key: string, value: unknown): void {
    this.kept.set(key, value);
  }
}

async function loaded(saved: unknown) {
  const data = new MadeUpData(saved);
  const device = new MadeUpDevice();
  const telling = new RecordedTelling();
  const campaign = { campaignFolder: null, open: vi.fn(async () => {}) };
  const settings = new SavedSettings({ data, device, settingsFolder: SETTINGS_FOLDER, telling }, campaign, async () => {});
  await settings.load();
  return { settings, data, device, telling };
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("SavedSettings", () => {
  it("reads the Campaigns folder and the chosen campaign from the plugin's data", async () => {
    const { settings } = await loaded({ campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon" });
    expect(settings.campaignsFolder.path).toBe("D&D");
    expect(settings.chosen.folder).toBe("D&D/Pale Moon");
  });

  it("drops a saved Campaigns folder inside the settings folder", async () => {
    const { settings } = await loaded({ campaignsFolder: `${SETTINGS_FOLDER}/D&D` });
    expect(settings.campaignsFolder.path).toBeNull();
  });

  it("writes what it saves to the plugin's data", async () => {
    const { settings, data } = await loaded({});
    await settings.saver.save({ welcomeSeen: true });
    expect(data.written).toHaveLength(1);
    expect(data.written[0]).toMatchObject({ welcomeSeen: true });
  });

  it("hands lines left in the data file to the kept drafts, then rewrites the file without them once the device holds them", async () => {
    const { settings, data, device } = await loaded({ drafts: { [ONE]: "? Who" } });
    const keptDrafts = { keepMoved: vi.fn() };
    const local = { flush: vi.fn(() => settings.oldDraftsKept()) };
    settings.moveOldDrafts(keptDrafts as unknown as KeptDrafts, local as unknown as LocalDrafts);
    await settled();
    expect(keptDrafts.keepMoved).toHaveBeenCalledExactlyOnceWith({ [ONE]: "? Who" });
    expect(device.kept.get(MOVED_KEY)).toBe(true);
    expect(data.written).toHaveLength(1);
    expect(data.written[0]).not.toHaveProperty("drafts");
  });

  it("keeps the lines in the data file while the device doesn't hold them yet", async () => {
    const { settings, data } = await loaded({ drafts: { [ONE]: "? Who" } });
    await settings.saver.save({ welcomeSeen: true });
    expect(data.written[0]).toMatchObject({ drafts: { [ONE]: "? Who" } });
  });

  it("says so when the data file can't be tidied", async () => {
    const { settings, data, telling } = await loaded({ drafts: { [ONE]: "? Who" } });
    data.failWrites = true;
    settings.moveOldDrafts({ keepMoved: vi.fn() } as unknown as KeptDrafts, { flush: vi.fn(() => settings.oldDraftsKept()) } as unknown as LocalDrafts);
    await settled();
    expect(telling.said).toEqual(["Couldn't tidy the plugin's settings file: data.json is read-only."]);
  });
});
