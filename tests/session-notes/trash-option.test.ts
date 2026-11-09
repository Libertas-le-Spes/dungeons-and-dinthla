import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { deletesPermanently } from "../../src/session-notes/trash-option";

function vaultSetTo(option: unknown) {
  const getConfig = vi.fn(() => option);
  return { vault: { getConfig } as unknown as Vault, getConfig };
}

describe("deletesPermanently", () => {
  it("reads Obsidian's Deleted files setting", () => {
    const { vault, getConfig } = vaultSetTo("system");
    deletesPermanently(vault);
    expect(getConfig).toHaveBeenCalledExactlyOnceWith("trashOption");
  });

  it("is false when deleted files go to the system trash or the vault's .trash folder", () => {
    expect(deletesPermanently(vaultSetTo("system").vault)).toBe(false);
    expect(deletesPermanently(vaultSetTo("local").vault)).toBe(false);
  });

  it("is true when Obsidian is set to delete permanently", () => {
    expect(deletesPermanently(vaultSetTo("none").vault)).toBe(true);
  });

  it("is true when the setting reads as nothing it knows, so the warning shows", () => {
    expect(deletesPermanently(vaultSetTo(undefined).vault)).toBe(true);
    expect(deletesPermanently(vaultSetTo("bin").vault)).toBe(true);
  });
});
