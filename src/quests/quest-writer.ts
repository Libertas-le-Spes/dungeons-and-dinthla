import type { QuestRecord } from "../campaign/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { questThreadKind } from "../campaign/quest-thread-kind";
import { linesAddedTo } from "../campaign/session-change";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { followUpRemovals, openingRemoval } from "../campaign/thread-removal";
import type { QuestPlan } from "./quest-plan";
import { questSessionChange } from "./quest-session-change";

export class QuestWriter {
  private readonly editor: NoteEditor;
  private readonly changes: SessionChangeWriter;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
    this.changes = new SessionChangeWriter(files);
  }

  async apply(plan: QuestPlan): Promise<boolean> {
    return this.changes.apply(questSessionChange(plan));
  }

  async add(line: string, sessionPath: string): Promise<boolean> {
    return this.changes.apply(linesAddedTo(sessionPath, [line]));
  }

  async delete(record: QuestRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questThreadKind, record), followUpRemovals(questThreadKind, record));
  }
}
