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

export function readMarker(line: string): MarkedLine {
  const text = line.trim();
  const symbol = text.charAt(0);
  const marker = MARKERS[symbol];
  const isLookup = text.charAt(1) === symbol;
  if (marker === undefined || isLookup) return { marker: null, body: text };
  return { marker, body: text.slice(1).trim() };
}
