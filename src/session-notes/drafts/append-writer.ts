import { NoteEditor, type EditorFiles } from "../../campaign/writing/note-editor";
import { linesToSave, lookupLinesLeft } from "./draft-lines";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export class AppendWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles, syntax: PropertiesSyntax) {
    this.editor = new NoteEditor(files, syntax);
  }

  async save(sessionPath: string, draft: string): Promise<string> {
    await this.editor.append(sessionPath, linesToSave(draft));
    return lookupLinesLeft(draft);
  }
}
