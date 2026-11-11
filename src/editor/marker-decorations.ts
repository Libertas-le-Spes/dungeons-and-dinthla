import { RangeSetBuilder, type EditorState } from "@codemirror/state";
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { firstLineAfterProperties } from "../campaign/paths/session-file";
import type { MarkerName } from "../kinds/marker-name";
import type { TrackedMarker } from "../kinds/tracked-marker";
import { ALL_MARKERS } from "../kinds/tracked-markers";
import { markerSpanOf } from "../notes/marker";

const PROPERTIES_SEARCH_LINES = 500;

export interface VisibleRange {
  from: number;
  to: number;
}

function colourOf(marker: TrackedMarker): [MarkerName, Decoration] {
  return [marker.name, Decoration.mark({ class: `dd-tokens dd-marker ${marker.colourClass}` })];
}

const MARKER_COLOURS = new Map<MarkerName, Decoration>(ALL_MARKERS.map(colourOf));

export function bodyStartOf(state: EditorState): number {
  const lastSearched = state.doc.line(Math.min(state.doc.lines, PROPERTIES_SEARCH_LINES));
  return firstLineAfterProperties(state.doc.sliceString(0, lastSearched.to));
}

export function markerDecorations(state: EditorState, ranges: readonly VisibleRange[]): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  let lastLine = bodyStartOf(state);
  for (const { from, to } of ranges) {
    let position = from;
    while (position <= to) {
      const line = state.doc.lineAt(position);
      position = line.to + 1;
      if (line.number <= lastLine) continue;
      lastLine = line.number;
      const span = markerSpanOf(line.text);
      if (span === null) continue;
      const colour = MARKER_COLOURS.get(span.marker);
      if (colour !== undefined) builder.add(line.from + span.start, line.from + span.end, colour);
    }
  }
  return builder.finish();
}

export function isSessionEditor(state: EditorState, isSessionNote: (path: string) => boolean): boolean {
  const info = state.field(editorInfoField, false);
  if (info === undefined || info.file === null) return false;
  return isSessionNote(info.file.path);
}

export function markerColouring(isSessionNote: (path: string) => boolean) {
  const colour = (view: EditorView): DecorationSet => {
    if (!isSessionEditor(view.state, isSessionNote)) return Decoration.none;
    return markerDecorations(view.state, view.visibleRanges);
  };

  class MarkerColouring {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = colour(view);
    }

    update(update: ViewUpdate): void {
      if (!update.docChanged && !update.viewportChanged) return;
      this.decorations = colour(update.view);
    }
  }

  return ViewPlugin.fromClass(MarkerColouring, { decorations: (colouring) => colouring.decorations });
}
