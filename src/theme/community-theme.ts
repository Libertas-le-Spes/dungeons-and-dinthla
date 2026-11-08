import type { Vault } from "obsidian";

interface VaultSettings {
  getConfig(key: "cssTheme"): unknown;
}

export function usesCommunityTheme(vault: Vault): boolean {
  const theme = (vault as unknown as VaultSettings).getConfig("cssTheme");
  return typeof theme === "string" && theme !== "";
}
