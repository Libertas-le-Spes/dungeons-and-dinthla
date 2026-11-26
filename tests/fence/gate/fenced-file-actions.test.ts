import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it, vi } from "vitest";
import { Fence, NOT_WRITTEN_AS_OBSIDIAN_WRITES, OUTSIDE_FENCE } from "../../../src/fence/paths/fence";
import { FencedFileActions, type RawFileManager } from "../../../src/fence/gate/fenced-file-actions";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { reportListenerSpy } from "./report-listener";
import { fileAt, folderAt, rawVaultWith } from "./fake-raw-vault";

const CONFIG_DIR = ".obsidian";

const CHARACTER = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");
const ITEMS = folderAt("D&D/Pale Moon/Items", []);
const PRIVATE_FOLDER = folderAt("Private/Empty", []);

function actionsWith() {
  const { vault } = rawVaultWith([CHARACTER, PRIVATE], [ITEMS, PRIVATE_FOLDER]);
  const fileManager = {
    processFrontMatter: vi.fn(async () => {}),
    renameFile: vi.fn(async () => {}),
    trashFile: vi.fn(async () => {}),
  };
  const held = new HeldFiles(vault, new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING));
  const reporter = new NoteReporter();
  const heard = reportListenerSpy();
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

  it("trashes a folder inside, and refuses one outside", async () => {
    const { actions, fileManager } = actionsWith();
    await actions.trashFolder(ITEMS);
    await expect(actions.trashFolder(PRIVATE_FOLDER)).rejects.toThrow(OUTSIDE_FENCE);
    expect(fileManager.trashFile).toHaveBeenCalledExactlyOnceWith(ITEMS);
  });

  it("reports no note written when it trashes a folder", async () => {
    const { actions, heard } = actionsWith();
    await actions.trashFolder(ITEMS);
    expect(heard.trashed).not.toHaveBeenCalled();
  });

  it("reports a note it trashed", async () => {
    const { actions, heard } = actionsWith();
    await actions.trashFile(CHARACTER);
    expect(heard.trashed).toHaveBeenCalledExactlyOnceWith(CHARACTER.path);
  });

  it("reports a rename with the path the note had and the path it has", async () => {
    const { actions, heard } = actionsWith();
    await actions.renameFile(CHARACTER, "D&D/Pale Moon/Characters/Mira Vale.md");
    expect(heard.renamed).toHaveBeenCalledExactlyOnceWith(CHARACTER.path, "D&D/Pale Moon/Characters/Mira Vale.md");
  });

  it("reports nothing for a change of properties, which isn't a save of text", async () => {
    const { actions, heard } = actionsWith();
    await actions.processFrontMatter(CHARACTER, () => {});
    expect(heard.heardNothing()).toBe(true);
  });

  it("reports nothing for a note it refused to rename or trash", async () => {
    const { actions, heard } = actionsWith();
    await expect(actions.trashFile(PRIVATE)).rejects.toThrow(OUTSIDE_FENCE);
    await expect(actions.renameFile(PRIVATE, "D&D/Pale Moon/Primary.md")).rejects.toThrow(OUTSIDE_FENCE);
    expect(heard.heardNothing()).toBe(true);
  });
});
