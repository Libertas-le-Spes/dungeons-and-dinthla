import { MARKER_NAMES, type MarkerName } from "./marker-name";
import type { TrackedMarker } from "./tracked-marker";
import { TRACKED_KINDS } from "./tracked-kinds";

const TRACKED_MARKERS = {
  question: TRACKED_KINDS.question.marker,
  quest: TRACKED_KINDS.quest.marker,
  ledger: TRACKED_KINDS.coin.marker,
} satisfies Record<MarkerName, TrackedMarker>;

export function markerNamed(name: MarkerName): TrackedMarker {
  return TRACKED_MARKERS[name];
}

export const ALL_MARKERS: TrackedMarker[] = MARKER_NAMES.map(markerNamed);

const MARKERS_BY_SYMBOL = new Map<string, TrackedMarker>(ALL_MARKERS.map((marker) => [marker.symbol, marker]));

export function markerBySymbol(symbol: string): TrackedMarker | undefined {
  return MARKERS_BY_SYMBOL.get(symbol);
}
