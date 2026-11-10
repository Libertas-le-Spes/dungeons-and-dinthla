import type { QuestRecord } from "../campaign/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { followUpRemovals, openingRemoval } from "../campaign/thread-removal";
import { isQuestLine } from "../notes/quest-lines";
import { outcomeRemoval, type QuestPlan } from "./quest-plan";

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async apply(plan: QuestPlan): Promise<boolean> {
    if (plan.removal === null) return this.editor.append(plan.targetPath, plan.added);
    return this.editor.replace(plan.targetPath, plan.added, plan.removal);
  }

  async add(line: string, sessionPath: string): Promise<boolean> {
    return this.editor.append(sessionPath, [line]);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(record, isQuestLine), followUpRemovals(record, "progress", outcomeRemoval(record)));
  }
}
