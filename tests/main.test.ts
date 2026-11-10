import { afterEach, describe, expect, it, vi } from "vitest";
import { Plugin, type App, type PluginManifest } from "obsidian";
import { NOT_THE_CONFIG_FOLDER } from "../src/fence/campaigns-folder-path";
import DungeonsAndDinthla from "../src/main";
import type { CampaignsFolderSetting } from "../src/settings/campaigns-folder-setting";

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

function pluginSaved(saved: unknown) {
  vi.stubGlobal("document", inertWith());
  vi.stubGlobal("window", inertWith());
  const app = inertWith({ vault: inertWith({ configDir: CONFIG_DIR }) }) as App;
  const plugin = new DungeonsAndDinthla(app, { version: "1.0.0" } as PluginManifest);
  const pluginParts = ["addChild", "register", "registerView", "registerEvent", "registerDomEvent", "registerEditorExtension", "registerMarkdownPostProcessor", "registerBasesView", "addRibbonIcon", "addCommand", "addSettingTab"];
  for (const part of pluginParts) Object.assign(plugin, { [part]: () => inertWith() });
  Object.assign(plugin, { loadData: async () => saved, saveData: async () => {} });
  return { plugin, campaignsFolder: () => (plugin as unknown as { campaignsFolderSetting: CampaignsFolderSetting }).campaignsFolderSetting };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DungeonsAndDinthla", () => {
  it("loads against the Obsidian stand-in", () => {
    expect(new DungeonsAndDinthla({ vault: { configDir: ".obsidian" } } as unknown as App, {} as PluginManifest)).toBeInstanceOf(Plugin);
  });

  it("drops a saved Campaigns folder inside the vault's own settings folder, whatever that folder is called", async () => {
    const { plugin, campaignsFolder } = pluginSaved({ campaignsFolder: `${CONFIG_DIR}/D&D` });
    await plugin.onload();
    expect(campaignsFolder().path).toBeNull();
  });

  it("refuses to choose a Campaigns folder inside the vault's own settings folder, whatever that folder is called", async () => {
    const { plugin, campaignsFolder } = pluginSaved({});
    await plugin.onload();
    await expect(campaignsFolder().choose(`${CONFIG_DIR}/D&D`)).rejects.toThrow(NOT_THE_CONFIG_FOLDER);
    expect(campaignsFolder().path).toBeNull();
  });
});
