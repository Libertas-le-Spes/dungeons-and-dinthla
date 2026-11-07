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

const MARKED_LINE = /^\s*([?!$])(?!\1)\s?(.*)$/;

export function readMarker(line: string): MarkedLine {
  const match = MARKED_LINE.exec(line);
  if (!match) return { marker: null, body: line };
  const [, symbol = "", body = ""] = match;
  return { marker: MARKERS[symbol] ?? null, body };
}
