import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { configReaderOf, VaultSettings } from "../../../src/fence/gate/vault-settings";

function settingsWith(config: Record<string, unknown>) {
  const getConfig = vi.fn((key: string) => config[key]);
  return { settings: new VaultSettings({ getConfig }), getConfig };
}

describe("VaultSettings", () => {
  it("reads where deleted files go", () => {
    const { settings, getConfig } = settingsWith({ trashOption: "local" });
    expect(settings.trashOption()).toBe("local");
    expect(getConfig).toHaveBeenCalledExactlyOnceWith("trashOption");
  });
});

function appWith(vault: object): Pick<App, "vault"> {
  return { vault } as Pick<App, "vault">;
}

describe("configReaderOf", () => {
  it("reads a setting through the vault's own getConfig, called on the vault", () => {
    const vault = {
      config: { trashOption: "local" } as Record<string, unknown>,
      getConfig(key: string): unknown {
        return this.config[key];
      },
    };
    expect(configReaderOf(appWith(vault)).getConfig("trashOption")).toBe("local");
  });

  it("reads nothing from a vault without getConfig", () => {
    for (const vault of [{}, { getConfig: "trashOption" }]) expect(configReaderOf(appWith(vault)).getConfig("trashOption")).toBeUndefined();
  });
});
