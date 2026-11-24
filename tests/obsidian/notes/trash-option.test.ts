import { describe, expect, it, vi } from "vitest";
import { deletesPermanently } from "../../../src/obsidian/notes/trash-option";

function vaultSettingsSetTo(option: unknown) {
  const trashOption = vi.fn(() => option);
  return { vaultSettings: { trashOption }, trashOption };
}

describe("deletesPermanently", () => {
  it("reads Obsidian's Deleted files setting", () => {
    const { vaultSettings, trashOption } = vaultSettingsSetTo("system");
    deletesPermanently(vaultSettings);
    expect(trashOption).toHaveBeenCalledOnce();
  });

  it("is false when deleted files go to the system trash or the vault's .trash folder", () => {
    expect(deletesPermanently(vaultSettingsSetTo("system").vaultSettings)).toBe(false);
    expect(deletesPermanently(vaultSettingsSetTo("local").vaultSettings)).toBe(false);
  });

  it("is true when Obsidian is set to delete permanently", () => {
    expect(deletesPermanently(vaultSettingsSetTo("none").vaultSettings)).toBe(true);
  });

  it("is true when the setting reads as nothing it knows, so the warning shows", () => {
    expect(deletesPermanently(vaultSettingsSetTo(undefined).vaultSettings)).toBe(true);
    expect(deletesPermanently(vaultSettingsSetTo("bin").vaultSettings)).toBe(true);
  });
});
