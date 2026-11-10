import { markerStartOf, withoutBullet } from "./bullet";
import { isFollowUp } from "./follow-up";
import { readItemChange } from "./item-change";

export type Marker = "question" | "quest" | "ledger";

export interface MarkedLine {
  marker: Marker | null;
  body: string;
}

const MARKERS = new Map<string, Marker>([
  ["?", "question"],
  ["!", "quest"],
  ["$", "ledger"],
]);

export function readMarker(line: string): MarkedLine {
  const written = line.trim();
  const text = withoutBullet(line);
  const symbol = text.charAt(0);
  const marker = MARKERS.get(symbol);
  const isLookup = text.charAt(1) === symbol;
  if (marker === undefined || isLookup || isFollowUp(text)) return { marker: null, body: written };
  return { marker, body: text.slice(1).trim() };
}

export interface MarkerSpan {
  marker: Marker;
  start: number;
  end: number;
}

export function markerSpanOf(line: string): MarkerSpan | null {
  const start = markerStartOf(line);
  const text = line.slice(start);
  const marker = MARKERS.get(text.charAt(0));
  if (marker === undefined) return null;
  if (isFollowUp(text) || readItemChange(line) !== null) return { marker, start, end: start + 2 };
  if (readMarker(line).marker === null) return null;
  return { marker, start, end: start + 1 };
}
