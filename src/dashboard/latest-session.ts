import type { Campaign, QuestionRecord, QuestRecord, SessionNote, Source } from "../campaign/campaign";
import type { LedgerLine } from "../funds/funds-summary";

export type WrittenLine =
  | { kind: "question"; source: Source; question: QuestionRecord }
  | { kind: "quest"; source: Source; quest: QuestRecord }
  | { kind: "coin"; source: Source; ledgerLine: LedgerLine };

export function latestSessionOf(sessions: SessionNote[]): SessionNote | null {
  let latest: SessionNote | null = null;
  for (const session of sessions) {
    if (latest === null || session.number > latest.number) latest = session;
  }
  return latest;
}

export function linesWrittenIn(path: string, campaign: Campaign, ledger: LedgerLine[]): WrittenLine[] {
  const lines: WrittenLine[] = [];
  for (const question of campaign.questions) {
    if (question.source.path === path) lines.push({ kind: "question", source: question.source, question });
  }
  for (const quest of campaign.quests) {
    if (quest.source.path === path) lines.push({ kind: "quest", source: quest.source, quest });
  }
  for (const ledgerLine of ledger) {
    if (ledgerLine.record.source.path === path) lines.push({ kind: "coin", source: ledgerLine.record.source, ledgerLine });
  }
  return lines.sort((first, second) => second.source.line - first.source.line);
}
