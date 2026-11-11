import type { Campaign, Source, SourcedText } from "../campaign/record/campaign";
import type { ThreadRecord } from "../campaign/threads/thread-kind";
import type { LedgerLine } from "../funds/page/funds-summary";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { ShownThreadKind } from "../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../views/threads/shown-thread-kinds";

export interface WrittenLineRows {
  addThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
    shown: ShownThreadKind<Thread, Ending, EndingName>,
    thread: Thread,
  ): void;
  addLedgerLine(ledgerLine: LedgerLine): void;
}

export interface WrittenLine {
  source: Source;
  addTo(rows: WrittenLineRows): void;
}

function threadsWrittenIn<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  path: string,
  campaign: Campaign,
  shown: ShownThreadKind<Thread, Ending, EndingName>,
): WrittenLine[] {
  const written = shown.threadsOf(campaign).filter((thread) => thread.source.path === path);
  return written.map((thread) => ({ source: thread.source, addTo: (rows) => rows.addThread(shown, thread) }));
}

function ledgerLinesWrittenIn(path: string, ledger: LedgerLine[]): WrittenLine[] {
  const written = ledger.filter((ledgerLine) => ledgerLine.record.source.path === path);
  return written.map((ledgerLine) => ({ source: ledgerLine.record.source, addTo: (rows) => rows.addLedgerLine(ledgerLine) }));
}

export function linesWrittenIn(path: string, campaign: Campaign, ledger: LedgerLine[]): WrittenLine[] {
  const threads = SHOWN_THREAD_KINDS.flatMap((shown) => threadsWrittenIn(path, campaign, shown));
  const lines = [...threads, ...ledgerLinesWrittenIn(path, ledger)];
  return lines.sort((first, second) => second.source.line - first.source.line);
}
