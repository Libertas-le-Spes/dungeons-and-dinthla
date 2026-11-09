import { NoteEditor, type EditorVault } from "../campaign/note-editor";
import { linesToSave, lookupLinesLeft } from "./draft-lines";

export class AppendWriter {
  private readonly editor: NoteEditor;

  constructor(vault: EditorVault) {
    this.editor = new NoteEditor(vault);
  }

  async save(sessionPath: string, draft: string): Promise<string> {
    await this.editor.append(sessionPath, linesToSave(draft));
    return lookupLinesLeft(draft);
  }
}
