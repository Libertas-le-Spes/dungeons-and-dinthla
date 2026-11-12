import { describe, expect, it, vi } from "vitest";
import { Fence, NOT_WRITTEN_AS_OBSIDIAN_WRITES, OUTSIDE_FENCE } from "../../../src/fence/paths/fence";
import { FencedFileActions, type RawFileManager } from "../../../src/fence/gate/fenced-file-actions";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { fileAt, rawVaultWith } from "./fake-raw-vault";

const CONFIG_DIR = ".obsidian";

const CHARACTER = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");

function actionsWith() {
  const { vault } = rawVaultWith([CHARACTER, PRIVATE]);
  const fileManager = {
    processFrontMatter: vi.fn(async () => {}),
    renameFile: vi.fn(async () => {}),
    trashFile: vi.fn(async () => {}),
  };
  const held = new HeldFiles(vault, new Fence(() => "D&D", CONFIG_DIR));
  const reporter = new NoteReporter();
  const heard = vi.fn();
  reporter.notes.listen(heard);
  return { actions: new FencedFileActions(fileManager as unknown as RawFileManager, held, reporter), fileManager, heard };
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

  it("refuses to rename a note to a path Obsidian would write another way", async () => {
    const { actions, fileManager } = actionsWith();
    await expect(actions.renameFile(CHARACTER, "D&D/Pale Moon/Characters/Zoe\u0308.md")).rejects.toThrow(NOT_WRITTEN_AS_OBSIDIAN_WRITES);
    expect(fileManager.renameFile).not.toHaveBeenCalled();
  });

  it("trashes a note inside, and refuses one outside", async () => {
    const { actions, fileManager } = actionsWith();
    await actions.trashFile(CHARACTER);
    await expect(actions.trashFile(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.trashFile).toHaveBeenCalledExactlyOnceWith(CHARACTER);
  });

  it("reports a note whose properties it changed, with no text", async () => {
    const { actions, heard } = actionsWith();
    await actions.processFrontMatter(CHARACTER, () => {});
    expect(heard).toHaveBeenCalledExactlyOnceWith({ change: "changed", path: CHARACTER.path, text: null });
  });

  it("reports a note it trashed", async () => {
    const { actions, heard } = actionsWith();
    await actions.trashFile(CHARACTER);
    expect(heard).toHaveBeenCalledExactlyOnceWith({ change: "trashed", path: CHARACTER.path, text: null });
  });

  it("reports nothing for a note it refused to change or trash", async () => {
    const { actions, heard } = actionsWith();
    await expect(actions.processFrontMatter(PRIVATE, () => {})).rejects.toThrow(OUTSIDE_FENCE);
    await expect(actions.trashFile(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(heard).not.toHaveBeenCalled();
  });
});
