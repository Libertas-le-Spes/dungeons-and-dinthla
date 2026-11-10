import type { Campaign, Source, SourcedText } from "../campaign/campaign";
import type { ThreadRecord } from "../campaign/thread-kind";
import type { LedgerLine } from "../funds/funds-summary";
import { coinTrackedKind } from "../kinds/coin-tracked-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { TrackedKindName } from "../kinds/tracked-kind";
import { questionPanelKind } from "./question-panel-kind";
import { questPanelKind } from "./quest-panel-kind";
import type { ThreadPanelKind } from "./thread-panel-kind";

export interface WrittenLineRows {
  addThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
    kind: ThreadPanelKind<Thread, Ending, EndingName>,
    thread: Thread,
  ): void;
  addLedgerLine(ledgerLine: LedgerLine): void;
}

export interface WrittenLine {
  kind: TrackedKindName;
  source: Source;
  addTo(rows: WrittenLineRows): void;
}

function threadsWrittenIn<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  path: string,
  campaign: Campaign,
  kind: ThreadPanelKind<Thread, Ending, EndingName>,
): WrittenLine[] {
  const written = kind.shown.threadsOf(campaign).filter((thread) => thread.source.path === path);
  return written.map((thread) => ({ kind: kind.shown.kind.tracked.name, source: thread.source, addTo: (rows) => rows.addThread(kind, thread) }));
}

function ledgerLinesWrittenIn(path: string, ledger: LedgerLine[]): WrittenLine[] {
  const written = ledger.filter((ledgerLine) => ledgerLine.record.source.path === path);
  return written.map((ledgerLine) => ({ kind: coinTrackedKind.name, source: ledgerLine.record.source, addTo: (rows) => rows.addLedgerLine(ledgerLine) }));
}

export function linesWrittenIn(path: string, campaign: Campaign, ledger: LedgerLine[]): WrittenLine[] {
  const lines = [...threadsWrittenIn(path, campaign, questionPanelKind), ...threadsWrittenIn(path, campaign, questPanelKind), ...ledgerLinesWrittenIn(path, ledger)];
  return lines.sort((first, second) => second.source.line - first.source.line);
}
