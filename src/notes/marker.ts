export type Marker = "question" | "quest" | "ledger";

export interface MarkedLine {
  marker: Marker | null;
  body: string;
}

const MARKERS: Record<string, Marker> = {
  "?": "question",
  "!": "quest",
  $: "ledger",
};

const LIST_BULLET = /^[-*+]\s+/;
const FOLLOW_UP_MARKER = /^(?:\?[+=]|![+=]|!x(?=\s|$))/;

export function withoutBullet(line: string): string {
  return line.trim().replace(LIST_BULLET, "");
}

export function readMarker(line: string): MarkedLine {
  const written = line.trim();
  const text = withoutBullet(line);
  const symbol = text.charAt(0);
  const marker = MARKERS[symbol];
  const isLookup = text.charAt(1) === symbol;
  const isFollowUp = FOLLOW_UP_MARKER.test(text);
  if (marker === undefined || isLookup || isFollowUp) return { marker: null, body: written };
  return { marker, body: text.slice(1).trim() };
}
