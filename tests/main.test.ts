import { afterEach, describe, expect, it, vi } from "vitest";
import { Plugin, type App, type PluginManifest } from "obsidian";
import { NOT_THE_CONFIG_FOLDER } from "../src/fence/paths/campaigns-folder-path";
import DungeonsAndDinthla from "../src/main";
import type { CampaignsFolderSetting } from "../src/settings/saved/campaigns-folder-setting";
import { AGREEMENT_KEY } from "../src/imports/agreement/device-agreement";
import { MadeUpDevice } from "./imports/agreement/made-up-device";

const CONFIG_DIR = "Vault Settings";

function inertWith(values: Record<PropertyKey, unknown> = {}): unknown {
  const inert: unknown = new Proxy(function stand() {}, {
    get: (_target, key) => {
      if (key in values) return values[key];
      if (key === "then" || typeof key === "symbol") return undefined;
      return inert;
    },
    apply: () => inert,
    construct: () => inert as object,
  });
  return inert;
}

async function nothingSaved(): Promise<void> {}

function pluginSaved(saved: unknown, device: MadeUpDevice) {
  vi.stubGlobal("document", inertWith());
  vi.stubGlobal("window", inertWith());
  const app = inertWith({ vault: inertWith({ configDir: CONFIG_DIR }), loadLocalStorage: device.loadLocalStorage, saveLocalStorage: device.saveLocalStorage }) as App;
  const plugin = new DungeonsAndDinthla(app, { version: "1.0.0" } as PluginManifest);
  const pluginParts = ["addChild", "register", "registerView", "registerEvent", "registerDomEvent", "registerEditorExtension", "registerMarkdownPostProcessor", "registerBasesView", "addRibbonIcon", "addCommand", "addSettingTab"];
  for (const part of pluginParts) Object.assign(plugin, { [part]: () => inertWith() });
  const saveData = vi.fn(nothingSaved);
  Object.assign(plugin, { loadData: async () => saved, saveData });
  return { plugin, saveData, campaignsFolder: () => (plugin as unknown as { campaignsFolderSetting: CampaignsFolderSetting }).campaignsFolderSetting };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DungeonsAndDinthla", () => {
  it("loads against the Obsidian stand-in", () => {
    expect(new DungeonsAndDinthla({ vault: { configDir: ".obsidian" } } as unknown as App, {} as PluginManifest)).toBeInstanceOf(Plugin);
  });

  it("drops a saved Campaigns folder inside the vault's own settings folder, whatever that folder is called", async () => {
    const { plugin, campaignsFolder } = pluginSaved({ campaignsFolder: `${CONFIG_DIR}/D&D` }, new MadeUpDevice());
    await plugin.onload();
    expect(campaignsFolder().path).toBeNull();
  });

  it("refuses to choose a Campaigns folder inside the vault's own settings folder, whatever that folder is called", async () => {
    const { plugin, campaignsFolder } = pluginSaved({}, new MadeUpDevice());
    await plugin.onload();
    await expect(campaignsFolder().choose(`${CONFIG_DIR}/D&D`)).rejects.toThrow(NOT_THE_CONFIG_FOLDER);
    expect(campaignsFolder().path).toBeNull();
  });

  it("keeps the D&D Beyond agreement in this device's own storage, never in the plugin's synced data.json", async () => {
    const device = new MadeUpDevice();
    const { plugin, saveData } = pluginSaved({}, device);
    await plugin.onload();
    plugin["deviceAgreement"].give();
    expect(device.saveLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY, true);
    expect(JSON.stringify(saveData.mock.calls)).not.toContain(AGREEMENT_KEY);
  });

  it("doesn't take a D&D Beyond agreement found in the plugin's synced data.json", async () => {
    const { plugin } = pluginSaved({ [AGREEMENT_KEY]: true }, new MadeUpDevice());
    await plugin.onload();
    expect(plugin["deviceAgreement"].given()).toBe(false);
  });

  it("takes the D&D Beyond agreement this device's own storage holds", async () => {
    const { plugin } = pluginSaved({}, MadeUpDevice.agreed());
    await plugin.onload();
    expect(plugin["deviceAgreement"].given()).toBe(true);
  });
});
