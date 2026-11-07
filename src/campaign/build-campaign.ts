import { readFollowUp, type FollowUp, type FollowUpKind } from "../notes/follow-up";
import { readItemChange } from "../notes/item-change";
import { readLedgerEntry } from "../notes/ledger";
import { readMarker } from "../notes/marker";
import { readQuest } from "../notes/quest";
import type {
  Campaign,
  CoinRecord,
  SourcedText,
  QuestionRecord,
  QuestRecord,
  SessionNote,
  Source,
} from "./campaign";
import { ItemBook } from "./item-book";
import { findSubject } from "./subject";

const QUESTION_FOLLOW_UPS: FollowUpKind[] = ["clue", "answer"];

class CampaignBuilder {
  private readonly questions: QuestionRecord[] = [];
  private readonly quests: QuestRecord[] = [];
  private readonly coins: CoinRecord[] = [];
  private readonly itemBook = new ItemBook();
  private readonly unmatched: SourcedText[] = [];

  addLine(line: string, source: Source): void {
    const followUp = readFollowUp(line);
    if (followUp !== null) {
      this.addFollowUp(followUp, line, source);
      return;
    }
    const change = readItemChange(line);
    if (change !== null) {
      this.itemBook.change(change, source);
      if (change.sale !== undefined) this.coins.push({ entry: change.sale, source });
      return;
    }
    this.addMarked(line, source);
  }

  build(): Campaign {
    const purseCopper = this.coins.reduce((sum, coin) => sum + coin.entry.copper, 0);
    return {
      questions: this.questions,
      quests: this.quests,
      coins: this.coins,
      items: this.itemBook.items,
      purseCopper,
      unmatched: this.unmatched,
    };
  }

  private addMarked(line: string, source: Source): void {
    const { marker, body } = readMarker(line);
    if (marker === "question" && body !== "") {
      this.questions.push({ text: body, source, clues: [], answer: null });
    }
    if (marker === "quest") {
      const quest = readQuest(body);
      if (quest.title !== "") this.quests.push({ quest, source, progress: [], outcome: null });
    }
    if (marker === "ledger") {
      const entry = readLedgerEntry(body);
      if (entry?.type === "coin") this.coins.push({ entry, source });
      if (entry?.type === "item") this.itemBook.mention(entry.item, entry.holder, source);
    }
  }

  private addFollowUp(followUp: FollowUp, line: string, source: Source): void {
    if (QUESTION_FOLLOW_UPS.includes(followUp.kind)) {
      this.addQuestionFollowUp(followUp, line, source);
      return;
    }
    this.addQuestFollowUp(followUp, line, source);
  }

  private addQuestionFollowUp(followUp: FollowUp, line: string, source: Source): void {
    const open = this.questions.filter((question) => question.answer === null);
    const found = findSubject(followUp.text, open, (question) => question.text);
    if (found === null) {
      this.unmatched.push({ text: line.trim(), source });
      return;
    }
    const sourcedText = { text: found.rest, source };
    if (followUp.kind === "answer") found.candidate.answer = sourcedText;
    if (followUp.kind === "clue") found.candidate.clues.push(sourcedText);
  }

  private addQuestFollowUp(followUp: FollowUp, line: string, source: Source): void {
    const active = this.quests.filter((quest) => quest.outcome === null);
    const found = findSubject(followUp.text, active, (quest) => quest.quest.title);
    if (found === null) {
      this.unmatched.push({ text: line.trim(), source });
      return;
    }
    const sourcedText = { text: found.rest, source };
    if (followUp.kind === "progress") found.candidate.progress.push(sourcedText);
    if (followUp.kind === "completed" || followUp.kind === "failed") {
      found.candidate.outcome = { ...sourcedText, status: followUp.kind };
    }
  }
}

function bySessionNumber(first: SessionNote, second: SessionNote): number {
  return first.number - second.number;
}

export function buildCampaign(sessions: SessionNote[]): Campaign {
  const builder = new CampaignBuilder();
  for (const session of [...sessions].sort(bySessionNumber)) {
    const lines = session.text.split("\n");
    for (let lineNumber = session.firstLine; lineNumber < lines.length; lineNumber++) {
      builder.addLine(lines[lineNumber]!, { path: session.path, line: lineNumber });
    }
  }
  return builder.build();
}
