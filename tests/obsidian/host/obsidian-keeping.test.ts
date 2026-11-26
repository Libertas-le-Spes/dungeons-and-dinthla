import { describe, expect, it, vi } from "vitest";
import { ObsidianDeviceStorage } from "../../../src/obsidian/host/obsidian-device-storage";
import { ObsidianPluginData } from "../../../src/obsidian/host/obsidian-plugin-data";

describe("ObsidianPluginData", () => {
  it("loads and saves through the functions for the plugin's own data file", async () => {
    const plugin = { loadData: vi.fn(async () => ({ welcomeSeen: true })), saveData: vi.fn(async () => {}) };
    const data = new ObsidianPluginData(plugin.loadData, plugin.saveData);
    await expect(data.load()).resolves.toEqual({ welcomeSeen: true });
    await data.save({ welcomeSeen: false });
    expect(plugin.saveData).toHaveBeenCalledExactlyOnceWith({ welcomeSeen: false });
  });
});

describe("ObsidianDeviceStorage", () => {
  it("loads and saves through the functions for Obsidian's storage on this device", () => {
    const app = { loadLocalStorage: vi.fn(() => "kept"), saveLocalStorage: vi.fn() };
    const device = new ObsidianDeviceStorage(app.loadLocalStorage, app.saveLocalStorage);
    expect(device.load("key")).toBe("kept");
    expect(app.loadLocalStorage).toHaveBeenCalledExactlyOnceWith("key");
    device.save("key", true);
    expect(app.saveLocalStorage).toHaveBeenCalledExactlyOnceWith("key", true);
  });
});
