import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { VaultSettings } from "../../src/fence/vault-settings";

function settingsWith(config: Record<string, unknown>) {
  const getConfig = vi.fn((key: string) => config[key]);
  return { settings: new VaultSettings({ getConfig } as unknown as Vault), getConfig };
}

describe("VaultSettings", () => {
  it("reads where deleted files go", () => {
    const { settings, getConfig } = settingsWith({ trashOption: "local", cssTheme: "Primary" });
    expect(settings.trashOption()).toBe("local");
    expect(getConfig).toHaveBeenCalledExactlyOnceWith("trashOption");
  });

  it("reads the community theme chosen", () => {
    const { settings, getConfig } = settingsWith({ trashOption: "local", cssTheme: "Primary" });
    expect(settings.cssTheme()).toBe("Primary");
    expect(getConfig).toHaveBeenCalledExactlyOnceWith("cssTheme");
  });
});
