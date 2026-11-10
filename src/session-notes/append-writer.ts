import { NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { linesToSave, lookupLinesLeft } from "./draft-lines";

export class AppendWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async save(sessionPath: string, draft: string): Promise<string> {
    await this.editor.append(sessionPath, linesToSave(draft));
    return lookupLinesLeft(draft);
  }
}
