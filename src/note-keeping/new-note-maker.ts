import type { TFile } from "obsidian";
import { parentFolderOf } from "../campaign/paths/note-name";
import type { ChangeProperties, FencedFileActions } from "../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../fence/gate/fenced-files";
import { hasNoWords, holdsOnlyPluginPropertiesIn } from "./note-words";
import { PropertyWriter } from "./property-writer";

export type MakerFiles = Pick<FencedFiles, "getFolderByPath" | "createFolder" | "create" | "read" | "process">;
export type MakerActions = Pick<FencedFileActions, "processFrontMatter" | "trashFile">;

export class NewNoteMaker {
  private readonly properties: PropertyWriter;

  constructor(
    private readonly files: MakerFiles,
    private readonly actions: MakerActions,
  ) {
    this.properties = new PropertyWriter(files, actions);
  }

  async make(path: string, change: ChangeProperties): Promise<void> {
    const folder = parentFolderOf(path);
    if (this.files.getFolderByPath(folder) === null) await this.files.createFolder(folder);
    const file = await this.files.create(path, "");
    await this.fill(file, change);
  }

  async fill(file: TFile, change: ChangeProperties): Promise<void> {
    try {
      await this.properties.set(file, change);
    } catch (error) {
      await this.discard(file);
      throw error;
    }
  }

  async trashIfNothingOfHis(file: TFile): Promise<boolean> {
    const text = await this.files.read(file);
    if (!hasNoWords(text) || !holdsOnlyPluginPropertiesIn(text)) return false;
    await this.actions.trashFile(file);
    return true;
  }

  private async discard(file: TFile): Promise<void> {
    try {
      await this.trashIfNothingOfHis(file);
    } catch {
      return;
    }
  }
}
