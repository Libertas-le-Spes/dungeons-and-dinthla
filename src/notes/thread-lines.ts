import type { FollowUpName } from "../kinds/follow-up-name";
import { followUpSymbolOf } from "../kinds/follow-ups";
import type { TrackedMarker } from "../kinds/tracked-marker";
import { readFollowUp } from "./follow-up";

export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function openingTextOf(marker: TrackedMarker, text: string): string {
  const written = oneLine(text);
  if (!written.startsWith(marker.symbol)) return written;
  return written.slice(marker.symbol.length).trimStart();
}

export function openingAfterLine(marker: TrackedMarker, followUp: string, earlier: string): string {
  return `${marker.symbol} ${openingTextOf(marker, followUp)}, after: ${earlier}`;
}

export function followUpLine(name: FollowUpName, subject: string, text: string): string {
  return `${followUpSymbolOf(name)} ${subject}: ${oneLine(text)}`;
}

export function isFollowUpLine(written: string, kind: FollowUpName, subject: string, note: string): boolean {
  const followUp = readFollowUp(written);
  if (followUp === null || followUp.kind !== kind || !followUp.text.startsWith(subject)) return false;
  const afterSubject = followUp.text.slice(subject.length).trimStart();
  return afterSubject.startsWith(":") && afterSubject.slice(1).trim() === note;
}
