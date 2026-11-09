import type { VaultSettings } from "../fence/vault-settings";

const KEPT_IN_A_TRASH = ["system", "local"];

export function deletesPermanently(settings: Pick<VaultSettings, "trashOption">): boolean {
  const option = settings.trashOption();
  return !KEPT_IN_A_TRASH.includes(String(option));
}
