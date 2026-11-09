import { describe, expect, it, vi } from "vitest";
import { Fence, OUTSIDE_FENCE } from "../../src/fence/fence";
import { FencedFileActions, type RawFileManager } from "../../src/fence/fenced-file-actions";
import { HeldFiles } from "../../src/fence/held-files";
import { fileAt, rawVaultWith } from "./fake-raw-vault";

const CHARACTER = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");

function actionsWith() {
  const { vault } = rawVaultWith([CHARACTER, PRIVATE]);
  const fileManager = {
    processFrontMatter: vi.fn(async () => {}),
    renameFile: vi.fn(async () => {}),
    trashFile: vi.fn(async () => {}),
  };
  const held = new HeldFiles(vault, new Fence(() => "D&D"));
  return { actions: new FencedFileActions(fileManager as unknown as RawFileManager, held), fileManager };
}

describe("FencedFileActions", () => {
  it("changes the properties of a note inside", async () => {
    const { actions, fileManager } = actionsWith();
    const change = () => {};
    await actions.processFrontMatter(CHARACTER, change);
    expect(fileManager.processFrontMatter).toHaveBeenCalledExactlyOnceWith(CHARACTER, change);
  });

  it("refuses to change the properties of a note outside", async () => {
    const { actions, fileManager } = actionsWith();
    await expect(actions.processFrontMatter(PRIVATE, () => {})).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
  });

  it("renames a note inside to another place inside", async () => {
    const { actions, fileManager } = actionsWith();
    await actions.renameFile(CHARACTER, "D&D/Pale Moon/Characters/Mira Vale.md");
    expect(fileManager.renameFile).toHaveBeenCalledExactlyOnceWith(CHARACTER, "D&D/Pale Moon/Characters/Mira Vale.md");
  });

  it("refuses to rename a note out of the Campaigns folder, or one that is outside", async () => {
    const { actions, fileManager } = actionsWith();
    await expect(actions.renameFile(CHARACTER, "Private/Mira.md")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(actions.renameFile(CHARACTER, "D&D/../Mira.md")).rejects.toThrow(OUTSIDE_FENCE);
    await expect(actions.renameFile(PRIVATE, "D&D/Pale Moon/Primary.md")).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.renameFile).not.toHaveBeenCalled();
  });

  it("trashes a note inside, and refuses one outside", async () => {
    const { actions, fileManager } = actionsWith();
    await actions.trashFile(CHARACTER);
    await expect(actions.trashFile(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.trashFile).toHaveBeenCalledExactlyOnceWith(CHARACTER);
  });
});
