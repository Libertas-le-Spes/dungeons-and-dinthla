import type { MarkerName } from "../kinds/marker-name";
import { markerBySymbol } from "../kinds/tracked-markers";
import { markerStartOf, withoutBullet } from "./bullet";
import { isFollowUp } from "./follow-up";
import { readItemChange } from "./item-change";

export interface MarkedLine {
  marker: MarkerName | null;
  body: string;
}

function markerNameOf(symbol: string): MarkerName | undefined {
  const marker = markerBySymbol(symbol);
  if (marker === undefined) return undefined;
  return marker.name;
}

export function readMarker(line: string): MarkedLine {
  const written = line.trim();
  const text = withoutBullet(line);
  const symbol = text.charAt(0);
  const marker = markerNameOf(symbol);
  const isLookup = text.charAt(1) === symbol;
  if (marker === undefined || isLookup || isFollowUp(text)) return { marker: null, body: written };
  return { marker, body: text.slice(1).trim() };
}

export interface MarkerSpan {
  marker: MarkerName;
  start: number;
  end: number;
}

export function markerSpanOf(line: string): MarkerSpan | null {
  const start = markerStartOf(line);
  const text = line.slice(start);
  const marker = markerNameOf(text.charAt(0));
  if (marker === undefined) return null;
  if (isFollowUp(text) || readItemChange(line) !== null) return { marker, start, end: start + 2 };
  if (readMarker(line).marker === null) return null;
  return { marker, start, end: start + 1 };
}
