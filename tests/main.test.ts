import { afterEach, describe, expect, it, vi } from "vitest";
import { Plugin, type App, type PluginManifest } from "obsidian";
import { NOT_THE_CONFIG_FOLDER } from "../src/fence/paths/campaigns-folder-path";
import DungeonsAndDinthla from "../src/main";
import type { CampaignsFolderSetting } from "../src/settings/saved/campaigns-folder-setting";
import { AGREEMENT_KEY } from "../src/imports/agreement/kept-agreement";
import { MadeUpDevice } from "./imports/agreement/made-up-device";
import { pressOn } from "./imports/agreement/shown-parts";
import { obsidianDocument } from "./stubs/obsidian-dom";
import type { WelcomeAgreement } from "../src/welcome/endings/welcome-ending";
import type { WelcomeWiringNeeds } from "../src/interface/sections/welcome-wiring";

const wired = vi.hoisted(() => ({ agreement: null as unknown }));

vi.mock("../src/interface/sections/welcome-wiring", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/interface/sections/welcome-wiring")>();
  return {
    ...original,
    welcomeWiring: (needs: WelcomeWiringNeeds) => {
      wired.agreement = needs.agreement;
      return original.welcomeWiring(needs);
    },
  };
});

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

function nothingToDo(): void {}

async function nothingSaved(): Promise<void> {}

function pluginSaved(saved: unknown, device: MadeUpDevice) {
  vi.stubGlobal("document", inertWith());
  vi.stubGlobal("window", inertWith());
  const app = inertWith({ vault: inertWith({ configDir: CONFIG_DIR }), loadLocalStorage: device.loadLocalStorage, saveLocalStorage: vi.fn() }) as App;
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

  it("keeps the D&D Beyond agreement in the plugin's data.json, so the vault carries it to every device", async () => {
    const { plugin, saveData } = pluginSaved({}, new MadeUpDevice());
    await plugin.onload();
    const stepEl = obsidianDocument().createElement("div");
    (wired.agreement as WelcomeAgreement).showIn(stepEl, nothingToDo);
    pressOn(stepEl, "Agree");
    await plugin["settingsSaver"].whenSaved();
    expect(saveData).toHaveBeenCalledOnce();
    expect(saveData).toHaveBeenCalledWith(expect.objectContaining({ beyondAgreed: true }));
  });

  it("takes the D&D Beyond agreement the plugin's data.json holds", async () => {
    const device = new MadeUpDevice();
    const { plugin } = pluginSaved({ beyondAgreed: true }, device);
    await plugin.onload();
    expect(plugin["keptAgreement"].given()).toBe(true);
    expect(device.loadLocalStorage).not.toHaveBeenCalledWith(AGREEMENT_KEY);
  });

  it.each([["true"], [1], [{}]])("takes no D&D Beyond agreement from %j in data.json", async (saved) => {
    const { plugin } = pluginSaved({ beyondAgreed: saved }, new MadeUpDevice());
    await plugin.onload();
    expect(plugin["keptAgreement"].given()).toBe(false);
  });

  it("takes the D&D Beyond agreement this device gave before it was kept in the vault", async () => {
    const { plugin } = pluginSaved({}, MadeUpDevice.agreedOnThisDeviceBefore());
    await plugin.onload();
    expect(plugin["keptAgreement"].given()).toBe(true);
  });
});
