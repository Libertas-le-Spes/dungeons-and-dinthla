import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { editorInfoField, type MarkdownFileInfo, type TFile } from "obsidian";
import { isSessionEditor, markerDecorations, type VisibleRange } from "../../src/editor/marker-decorations";
import { STUB_SYNTAX } from "../host/stub-syntax";

function marked(doc: string, ranges: VisibleRange[] = [{ from: 0, to: doc.length }]): [string, string][] {
  const state = EditorState.create({ doc });
  const decorations = markerDecorations(state, ranges, STUB_SYNTAX);
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

  it("leaves the note's properties uncoloured, as the readers skip them", () => {
    expect(marked("---\n? key: value\n---\n? Who").map(([text]) => text)).toEqual(["?"]);
  });
});

describe("isSessionEditor", () => {
  const isSession = (path: string) => path === "Pale Moon/Sessions/Session 1.md";

  function editorOn(file: TFile | null): EditorState {
    const info = { file } as unknown as MarkdownFileInfo;
    return EditorState.create({ extensions: [editorInfoField.init(() => info)] });
  }

  it("colours an editor showing a session note", () => {
    expect(isSessionEditor(editorOn({ path: "Pale Moon/Sessions/Session 1.md" } as TFile), isSession)).toBe(true);
  });

  it("leaves an editor on any other note, or on no note, alone", () => {
    expect(isSessionEditor(editorOn({ path: "Inbox.md" } as TFile), isSession)).toBe(false);
    expect(isSessionEditor(editorOn(null), isSession)).toBe(false);
  });

  it("leaves an editor Obsidian hasn't told about its note alone", () => {
    expect(isSessionEditor(EditorState.create(), isSession)).toBe(false);
  });
});
