import { NoteEditor, type EditorFiles } from "../../campaign/writing/note-editor";
import { onlyLinkTargetsChanged, withLinksRewritten } from "./link-rewriting";
import type { NewTarget } from "./wiki-links";

export const MORE_THAN_LINK_NAMES = "That would change more than the names in links, so nothing was written.";

export type LinkFiles = EditorFiles;

export class LinkWriter {
  private readonly editor: NoteEditor;

  constructor(files: LinkFiles) {
    this.editor = new NoteEditor(files);
  }

  async rewrite(path: string, newTarget: NewTarget): Promise<void> {
    await this.editor.changeText(path, MORE_THAN_LINK_NAMES, (text) => {
      const rewritten = withLinksRewritten(text, newTarget);
      if (!onlyLinkTargetsChanged(text, rewritten, newTarget)) return null;
      return rewritten;
    });
  }
}
