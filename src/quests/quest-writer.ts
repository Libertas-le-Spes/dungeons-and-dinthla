import type { QuestOutcome, QuestRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import type { FollowUpKind } from "../notes/follow-up";
import {
  followUpQuestLine,
  isCoinReward,
  isQuestLine,
  outcomeLine,
  progressLine,
  questTextOf,
  rewardLine,
  type FinishedStatus,
} from "../notes/quest-lines";
import { isFollowUpLine, oneLine } from "../notes/question-lines";

export type QuestStatusChoice = "active" | FinishedStatus;

export interface QuestEdit {
  status: QuestStatusChoice;
  happened: string;
  collectReward: boolean;
  followUp: string;
}

function followUpRemoval(record: QuestRecord, kind: FollowUpKind, note: SourcedText): Removal {
  return {
    path: note.source.path,
    line: note.source.line,
    matches: (written) => isFollowUpLine(written, kind, record.quest.title, note.text),
  };
}

function outcomeRemoval(record: QuestRecord, outcome: QuestOutcome): Removal {
  return followUpRemoval(record, outcome.status, outcome);
}

function questRemoval(record: QuestRecord): Removal {
  return { path: record.source.path, line: record.source.line, matches: (written) => isQuestLine(written, record.quest.title) };
}

function outcomeChanged(record: QuestRecord, status: FinishedStatus, happened: string): boolean {
  const outcome = record.outcome;
  if (outcome === null) return true;
  return outcome.status !== status || happened !== oneLine(outcome.text);
}

function canCollectReward(record: QuestRecord): boolean {
  const reward = record.quest.reward;
  return record.outcome === null && reward !== undefined && isCoinReward(reward);
}

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(vault: EditorVault) {
    this.editor = new NoteEditor(vault);
  }

  static canCollectReward(record: QuestRecord): boolean {
    return canCollectReward(record);
  }

  async save(record: QuestRecord, edit: QuestEdit, sessionPath: string): Promise<boolean> {
    const title = record.quest.title;
    const happened = oneLine(edit.happened);
    const added: string[] = [];
    let old: Removal | null = null;
    if (edit.status === "active") {
      if (record.outcome !== null) old = outcomeRemoval(record, record.outcome);
      if (happened !== "") added.push(progressLine(title, happened));
    } else if (outcomeChanged(record, edit.status, happened)) {
      added.push(outcomeLine(edit.status, title, happened));
      if (record.outcome !== null) old = outcomeRemoval(record, record.outcome);
    }
    if (edit.status === "completed" && edit.collectReward && canCollectReward(record)) {
      added.push(rewardLine(record.quest.reward!, title));
    }
    const followUp = questTextOf(edit.followUp);
    if (followUp !== "") added.push(followUpQuestLine(followUp, title));
    if (old === null) return this.editor.append(sessionPath, added);
    return this.editor.replace(sessionPath, added, old);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    const others = record.progress.map((note) => followUpRemoval(record, "progress", note));
    if (record.outcome !== null) others.push(outcomeRemoval(record, record.outcome));
    return this.editor.removeWithItsLines(questRemoval(record), others);
  }
}
