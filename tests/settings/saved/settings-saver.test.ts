import { describe, expect, it } from "vitest";
import type { PluginSettings } from "../../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";

const SETTINGS: PluginSettings = { campaignsFolder: "D&D", campaignFolder: "D&D/Pale Moon", welcomeSeen: true, lastVersionSeen: "0.2.0", notesMadeFor: [], beyondAgreed: false };

interface Write {
  settings: PluginSettings;
  finish(): void;
  fail(error: Error): void;
}

function heldSaver() {
  const writes: Write[] = [];
  const saver = new SettingsSaver({ ...SETTINGS }, (settings) => {
    return new Promise<void>((resolve, reject) => {
      writes.push({ settings: { ...settings }, finish: resolve, fail: reject });
    });
  });
  return { saver, writes };
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function writeAt(writes: Write[], index: number): Write {
  const write = writes[index];
  if (write === undefined) throw new Error(`No write ${index} yet.`);
  return write;
}

describe("SettingsSaver", () => {
  it("writes the settings with only the change made", async () => {
    const { saver, writes } = heldSaver();
    const saving = saver.save({ lastVersionSeen: "0.3.0" });
    await settled();
    expect(writes.map((write) => write.settings)).toEqual([{ ...SETTINGS, lastVersionSeen: "0.3.0" }]);
    writeAt(writes, 0).finish();
    await saving;
  });

  it("changes the settings in memory only once the write succeeds", async () => {
    const { saver, writes } = heldSaver();
    const saving = saver.save({ campaignsFolder: "Games/D&D" });
    await settled();
    expect(saver.settings.campaignsFolder).toBe("D&D");
    writeAt(writes, 0).finish();
    await saving;
    expect(saver.settings.campaignsFolder).toBe("Games/D&D");
  });

  it("keeps the settings in memory as they were when the write fails", async () => {
    const { saver, writes } = heldSaver();
    const saving = saver.save({ campaignsFolder: "Games/D&D" });
    await settled();
    writeAt(writes, 0).fail(new Error("data.json is read-only."));
    await expect(saving).rejects.toThrow("data.json is read-only.");
    expect(saver.settings).toEqual(SETTINGS);
  });

  it("starts a save only once the one before it is done", async () => {
    const { saver, writes } = heldSaver();
    const first = saver.save({ campaignsFolder: "Games/D&D" });
    const second = saver.save({ lastVersionSeen: "0.3.0" });
    await settled();
    expect(writes).toHaveLength(1);
    writeAt(writes, 0).finish();
    await first;
    await settled();
    expect(writes).toHaveLength(2);
    writeAt(writes, 1).finish();
    await second;
  });

  it("never writes a value older than one an earlier save wrote", async () => {
    const { saver, writes } = heldSaver();
    const first = saver.save({ campaignsFolder: "Games/D&D" });
    const second = saver.save({ lastVersionSeen: "0.3.0" });
    await settled();
    writeAt(writes, 0).finish();
    await first;
    await settled();
    writeAt(writes, 1).finish();
    await second;
    expect(writeAt(writes, 1).settings).toEqual({ ...SETTINGS, campaignsFolder: "Games/D&D", lastVersionSeen: "0.3.0" });
    expect(saver.settings).toEqual({ ...SETTINGS, campaignsFolder: "Games/D&D", lastVersionSeen: "0.3.0" });
  });

  it("goes on to the next save after one fails", async () => {
    const { saver, writes } = heldSaver();
    const first = saver.save({ campaignsFolder: "Games/D&D" });
    const second = saver.save({ lastVersionSeen: "0.3.0" });
    await settled();
    writeAt(writes, 0).fail(new Error("data.json is read-only."));
    await expect(first).rejects.toThrow("data.json is read-only.");
    await settled();
    writeAt(writes, 1).finish();
    await second;
    expect(writeAt(writes, 1).settings).toEqual({ ...SETTINGS, lastVersionSeen: "0.3.0" });
  });

  it("works out a change from the settings the save before it left", async () => {
    const { saver, writes } = heldSaver();
    const first = saver.save({ campaignsFolder: "Games/D&D" });
    const seen: (string | null)[] = [];
    const second = saver.saveFrom((settings) => {
      seen.push(settings.campaignsFolder);
      return { lastVersionSeen: "0.3.0" };
    });
    await settled();
    expect(seen).toEqual([]);
    writeAt(writes, 0).finish();
    await first;
    await settled();
    expect(seen).toEqual(["Games/D&D"]);
    writeAt(writes, 1).finish();
    expect(await second).toBe(true);
  });

  it("writes nothing, and says so, when there is no change to make", async () => {
    const { saver, writes } = heldSaver();
    expect(await saver.saveFrom(() => null)).toBe(false);
    expect(writes).toEqual([]);
    expect(saver.settings).toEqual(SETTINGS);
  });
});

describe("SettingsSaver.whenSaved", () => {
  it("waits for every save queued before it, even one that fails", async () => {
    const { saver, writes } = heldSaver();
    const first = saver.save({ lastVersionSeen: "0.3.0" });
    const second = saver.save({ welcomeSeen: false });
    let saved = false;
    const waiting = saver.whenSaved().then(() => {
      saved = true;
    });
    await settled();
    writeAt(writes, 0).finish();
    await first;
    await settled();
    expect(saved).toBe(false);
    writeAt(writes, 1).fail(new Error("The disk is full."));
    await expect(second).rejects.toThrow("The disk is full.");
    await waiting;
    expect(saved).toBe(true);
  });
});
