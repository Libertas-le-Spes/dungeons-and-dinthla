import { describe, expect, it, vi } from "vitest";
import { deletesPermanently } from "../../src/session-notes/trash-option";

function settingsSetTo(option: unknown) {
  const trashOption = vi.fn(() => option);
  return { settings: { trashOption }, trashOption };
}

describe("deletesPermanently", () => {
  it("reads Obsidian's Deleted files setting", () => {
    const { settings, trashOption } = settingsSetTo("system");
    deletesPermanently(settings);
    expect(trashOption).toHaveBeenCalledOnce();
  });

  it("is false when deleted files go to the system trash or the vault's .trash folder", () => {
    expect(deletesPermanently(settingsSetTo("system").settings)).toBe(false);
    expect(deletesPermanently(settingsSetTo("local").settings)).toBe(false);
  });

  it("is true when Obsidian is set to delete permanently", () => {
    expect(deletesPermanently(settingsSetTo("none").settings)).toBe(true);
  });

  it("is true when the setting reads as nothing it knows, so the warning shows", () => {
    expect(deletesPermanently(settingsSetTo(undefined).settings)).toBe(true);
    expect(deletesPermanently(settingsSetTo("bin").settings)).toBe(true);
  });
});
