import type { VaultSettings } from "../fence/vault-settings";

const KEPT_IN_A_TRASH = ["system", "local"];

export function deletesPermanently(vaultSettings: Pick<VaultSettings, "trashOption">): boolean {
  const option = vaultSettings.trashOption();
  return !KEPT_IN_A_TRASH.includes(String(option));
}
