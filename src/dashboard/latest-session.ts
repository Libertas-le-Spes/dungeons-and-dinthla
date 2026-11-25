import { onePerItem } from "../campaign/record/one-per-item";
import type { Campaign, Source, SourcedText } from "../campaign/record/campaign";
import type { ThreadRecord } from "../campaign/threads/thread-kind";
import type { LedgerLine } from "../funds/page/funds-summary";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { ItemEventLine } from "./rows/item-event-row";
import type { ShownThreadKind } from "../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../views/threads/shown-thread-kinds";

export interface WrittenLineRows {
  addThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
    shown: ShownThreadKind<Thread, Ending, EndingName>,
    thread: Thread,
  ): void;
  addLedgerLine(ledgerLine: LedgerLine): void;
  addItemEvent(itemEvent: ItemEventLine): void;
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

function itemEventsWrittenIn(path: string, campaign: Campaign, ledgerLines: WrittenLine[]): WrittenLine[] {
  const events = onePerItem(campaign.items).flatMap((item) => item.history.map((event) => ({ item, event })));
  const written = events.filter((itemEvent) => itemEvent.event.source.path === path);
  const alone = written.filter((itemEvent) => !ledgerLines.some((line) => line.source.line === itemEvent.event.source.line));
  return alone.map((itemEvent) => ({ source: itemEvent.event.source, addTo: (rows) => rows.addItemEvent(itemEvent) }));
}

const SHOWN_OF_EACH_KIND = 3;

function latestFirst(lines: WrittenLine[]): WrittenLine[] {
  return [...lines].sort((first, second) => second.source.line - first.source.line);
}

function latestOfKind(lines: WrittenLine[]): WrittenLine[] {
  return latestFirst(lines).slice(0, SHOWN_OF_EACH_KIND);
}

export function kindsWrittenIn(path: string, campaign: Campaign, ledger: LedgerLine[]): WrittenLine[][] {
  const threads = SHOWN_THREAD_KINDS.map((shown) => threadsWrittenIn(path, campaign, shown));
  const ledgerLines = ledgerLinesWrittenIn(path, ledger);
  const coinsAndItems = [...ledgerLines, ...itemEventsWrittenIn(path, campaign, ledgerLines)];
  return [...threads, coinsAndItems];
}

export function everyLineOf(kinds: WrittenLine[][]): WrittenLine[] {
  return latestFirst(kinds.flat());
}

export function latestOfEachKind(kinds: WrittenLine[][]): WrittenLine[] {
  return latestFirst(kinds.flatMap(latestOfKind));
}

export function linesWrittenIn(path: string, campaign: Campaign, ledger: LedgerLine[]): WrittenLine[] {
  return everyLineOf(kindsWrittenIn(path, campaign, ledger));
}
