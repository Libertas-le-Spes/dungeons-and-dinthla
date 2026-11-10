import type { VaultSettings } from "../fence/vault-settings";

export function usesCommunityTheme(vaultSettings: Pick<VaultSettings, "cssTheme">): boolean {
  const theme = vaultSettings.cssTheme();
  return typeof theme === "string" && theme !== "";
}
