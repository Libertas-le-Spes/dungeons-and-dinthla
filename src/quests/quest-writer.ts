import type { QuestRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import type { FollowUpKind } from "../notes/follow-up";
import { isQuestLine } from "../notes/quest-lines";
import { isFollowUpLine } from "../notes/question-lines";
import { outcomeRemoval, type QuestPlan } from "./quest-plan";

function followUpRemoval(record: QuestRecord, kind: FollowUpKind, note: SourcedText): Removal {
  return {
    path: note.source.path,
    line: note.source.line,
    matches: (written) => isFollowUpLine(written, kind, record.quest.title, note.text),
  };
}

function questRemoval(record: QuestRecord): Removal {
  return { path: record.source.path, line: record.source.line, matches: (written) => isQuestLine(written, record.quest.title) };
}

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(vault: EditorVault) {
    this.editor = new NoteEditor(vault);
  }

  async apply(plan: QuestPlan): Promise<boolean> {
    if (plan.removal === null) return this.editor.append(plan.targetPath, plan.added);
    return this.editor.replace(plan.targetPath, plan.added, plan.removal);
  }

  async add(line: string, sessionPath: string): Promise<boolean> {
    return this.editor.append(sessionPath, [line]);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    const others = record.progress.map((note) => followUpRemoval(record, "progress", note));
    const outcome = outcomeRemoval(record);
    if (outcome !== null) others.push(outcome);
    return this.editor.removeWithItsLines(questRemoval(record), others);
  }
}
