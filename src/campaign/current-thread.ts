import { oneLine } from "../notes/thread-lines";
import type { Source, SourcedText, Thread } from "./campaign";
import { CHANGED_IN_NOTE } from "./note-editor";
import { sessionNumberOf } from "./session-file";
import { findSubject } from "./subject";

export function placesOf(thread: Thread<SourcedText>): Source[] {
  const sources = [thread.source, ...thread.notes.map((note) => note.source)];
  if (thread.closing !== null) sources.push(thread.closing.source);
  return sources;
}

export function currentThread<T extends Thread<SourcedText>>(threads: T[], opened: T, isSame: (current: T, opened: T) => boolean): T {
  const current = threads.find((thread) => isSame(thread, opened));
  if (current === undefined) throw new Error(CHANGED_IN_NOTE);
  return current;
}

export function sharesTextWithEarlierOpenThread(threads: Thread<SourcedText>[], thread: Thread<SourcedText>): boolean {
  const index = threads.indexOf(thread);
  return threads.slice(0, index).some((earlier) => earlier.closing === null && earlier.text === thread.text);
}

export function latestSessionOf(thread: Thread<SourcedText>, campaignFolder: string): number {
  let latest = 0;
  for (const source of placesOf(thread)) {
    const number = sessionNumberOf(source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}

export function followUpWouldGoElsewhere(threads: Thread<SourcedText>[], thread: Thread<SourcedText>, text: string): boolean {
  const open = threads.filter((candidate) => candidate === thread || candidate.closing === null);
  const found = findSubject(`${thread.text}: ${oneLine(text)}`, open, (candidate) => candidate.text);
  return found !== null && found.candidate !== thread;
}
