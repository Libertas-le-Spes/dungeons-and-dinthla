import type { Vault } from "obsidian";

interface VaultSettings {
  getConfig(key: "trashOption"): unknown;
}

const KEPT_IN_A_TRASH = ["system", "local"];

export function deletesPermanently(vault: Vault): boolean {
  const option = (vault as unknown as VaultSettings).getConfig("trashOption");
  return !KEPT_IN_A_TRASH.includes(String(option));
}
