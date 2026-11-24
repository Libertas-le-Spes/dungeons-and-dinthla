import type { Campaign, Source, SourcedText } from "../../campaign/record/campaign";
import type { ThreadRecord } from "../../campaign/threads/thread-kind";
import type { CoinOutcome } from "../../funds/coins/coin-dialog";
import type { FollowUpName } from "../../kinds/follow-up-name";
import type { ShownThreadKind } from "../../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../../views/threads/shown-thread-kinds";
import type { ThreadRowOpeners } from "../../views/threads/thread-openers";

export interface LineOpeners extends ThreadRowOpeners {
  openItem(name: string, source: Source, onClosed: (changed: boolean) => void): void;
  openLedgerEntry(source: Source, onClosed: (outcome: CoinOutcome) => void): void;
}

export interface LineClosed {
  changed: boolean;
  gone: boolean;
}

export type OpenLine = (onClosed: (closed: LineClosed) => void) => void;

export interface LineSearch {
  campaign: Campaign;
  source: Source;
  openers: LineOpeners;
}

type FindOpener = (search: LineSearch) => OpenLine | null;

function isAt(written: Source, source: Source): boolean {
  return written.path === source.path && written.line === source.line;
}

function stillThere(changed: boolean): LineClosed {
  return { changed, gone: false };
}

function threadOpener<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
): FindOpener {
  return ({ campaign, source, openers }) => {
    const thread = shown.threadsOf(campaign).find((candidate) => isAt(candidate.source, source));
    if (thread === undefined) return null;
    return (onClosed) => shown.open(openers, source, (changed) => onClosed(stillThere(changed)));
  };
}

function itemOpener({ campaign, source, openers }: LineSearch): OpenLine | null {
  const item = campaign.items.find((candidate) => candidate.history.some((event) => isAt(event.source, source)));
  if (item === undefined) return null;
  return (onClosed) => openers.openItem(item.name, source, (changed) => onClosed(stillThere(changed)));
}

function coinOpener({ campaign, source, openers }: LineSearch): OpenLine | null {
  const coin = campaign.coins.find((candidate) => isAt(candidate.source, source));
  if (coin === undefined) return null;
  return (onClosed) => openers.openLedgerEntry(source, (outcome) => onClosed({ changed: outcome !== "unchanged", gone: outcome === "deleted" }));
}

const FIND_OPENERS: FindOpener[] = [...SHOWN_THREAD_KINDS.map(threadOpener), itemOpener, coinOpener];

export function lineOpenerOf(search: LineSearch): OpenLine | null {
  for (const find of FIND_OPENERS) {
    const opener = find(search);
    if (opener !== null) return opener;
  }
  return null;
}
