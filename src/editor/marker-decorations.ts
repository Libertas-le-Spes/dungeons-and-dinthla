import { RangeSetBuilder, type EditorState } from "@codemirror/state";
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from "@codemirror/view";
import { markerSpanOf, type Marker } from "../notes/marker";

export interface VisibleRange {
  from: number;
  to: number;
}

const MARKS: Record<Marker, Decoration> = {
  question: Decoration.mark({ class: "dd-tokens dd-marker dd-marker-question" }),
  quest: Decoration.mark({ class: "dd-tokens dd-marker dd-marker-quest" }),
  ledger: Decoration.mark({ class: "dd-tokens dd-marker dd-marker-ledger" }),
};

export function markerDecorations(state: EditorState, ranges: readonly VisibleRange[]): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  let lastLine = 0;
  for (const { from, to } of ranges) {
    let position = from;
    while (position <= to) {
      const line = state.doc.lineAt(position);
      position = line.to + 1;
      if (line.number <= lastLine) continue;
      lastLine = line.number;
      const span = markerSpanOf(line.text);
      if (span !== null) builder.add(line.from + span.start, line.from + span.end, MARKS[span.marker]);
    }
  }
  return builder.finish();
}

class MarkerHighlighter {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = markerDecorations(view.state, view.visibleRanges);
  }

  update(update: ViewUpdate): void {
    if (!update.docChanged && !update.viewportChanged) return;
    this.decorations = markerDecorations(update.state, update.view.visibleRanges);
  }
}

export const markerHighlighter = ViewPlugin.fromClass(MarkerHighlighter, {
  decorations: (highlighter) => highlighter.decorations,
});
