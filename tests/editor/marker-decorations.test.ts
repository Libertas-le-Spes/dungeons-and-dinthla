import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { markerDecorations, type VisibleRange } from "../../src/editor/marker-decorations";

function marked(doc: string, ranges: VisibleRange[] = [{ from: 0, to: doc.length }]): [string, string][] {
  const state = EditorState.create({ doc });
  const decorations = markerDecorations(state, ranges);
  const found: [string, string][] = [];
  decorations.between(0, doc.length, (from, to, decoration) => {
    found.push([doc.slice(from, to), String(decoration.spec.class)]);
  });
  return found;
}

describe("markerDecorations", () => {
  it("marks the glyph of each question, quest and ledger line with its colour", () => {
    expect(marked("? Who\nWe rode on.\n! Find it\n$ 5 gp")).toEqual([
      ["?", "dd-tokens dd-marker dd-marker-question"],
      ["!", "dd-tokens dd-marker dd-marker-quest"],
      ["$", "dd-tokens dd-marker dd-marker-ledger"],
    ]);
  });

  it("marks a glyph after a list bullet, and both characters of a follow-up", () => {
    expect(marked("- ? Who\n?= Who: Mira").map(([text]) => text)).toEqual(["?", "?="]);
  });

  it("leaves a lookup line unmarked", () => {
    expect(marked("?? letter\n!! caravan\n$$ lan")).toEqual([]);
  });

  it("marks only the lines in view", () => {
    const doc = "? First\n? Second\n? Third";
    expect(marked(doc, [{ from: 8, to: 16 }])).toEqual([["?", "dd-tokens dd-marker dd-marker-question"]]);
  });

  it("marks a line once when two visible ranges share it", () => {
    const doc = "? One long line";
    expect(marked(doc, [{ from: 0, to: 4 }, { from: 6, to: doc.length }])).toHaveLength(1);
  });
});
