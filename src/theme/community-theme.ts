import type { VaultSettings } from "../fence/vault-settings";

export function usesCommunityTheme(settings: Pick<VaultSettings, "cssTheme">): boolean {
  const theme = settings.cssTheme();
  return typeof theme === "string" && theme !== "";
}
