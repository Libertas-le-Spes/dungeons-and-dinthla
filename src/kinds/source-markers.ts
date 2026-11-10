import type { Marker } from "../notes/marker";
import type { SourceMarker } from "./source-marker";
import { SOURCE_KINDS } from "./source-kinds";

function markersOf(): SourceMarker[] {
  const markers = new Set<SourceMarker>();
  for (const kind of SOURCE_KINDS) markers.add(kind.marker);
  return Array.from(markers);
}

export const SOURCE_MARKERS = markersOf();

const MARKERS_BY_NAME = new Map<Marker, SourceMarker>(SOURCE_MARKERS.map((marker) => [marker.name, marker]));

export function markerNamed(name: Marker): SourceMarker {
  return MARKERS_BY_NAME.get(name)!;
}
