import { describe, expect, it } from "vitest";
import type { Editor, MarkdownFileInfo, TFile } from "obsidian";
import { editorTextOf, editorTextsOf } from "../../../src/campaign/reading/editor-text";

const session = { path: "Pale Moon/Sessions/Session 3.md" } as TFile;
const other = { path: "Pale Moon/Characters/Mira.md" } as TFile;

function editorShowing(file: TFile | null, text: string): MarkdownFileInfo {
  return { file, editor: { getValue: () => text } as Editor } as MarkdownFileInfo;
}

function vaultHolding(...files: TFile[]) {
  return { getFileByPath: (path: string) => files.find((file) => file.path === path) ?? null };
}

describe("editorTextOf", () => {
  it("reads the editor while it still shows the note that was edited", () => {
    expect(editorTextOf(editorShowing(session, "? Who\n"), session, vaultHolding(session))).toBe("? Who\n");
  });

  it("reads nothing once the editor has moved on to another note", () => {
    expect(editorTextOf(editorShowing(other, "Mira's notes\n"), session, vaultHolding(session, other))).toBeNull();
  });

  it("reads nothing once the note was deleted", () => {
    expect(editorTextOf(editorShowing(session, "? Who\n"), session, vaultHolding())).toBeNull();
  });

  it("reads nothing when there is no editor", () => {
    expect(editorTextOf({ file: session } as MarkdownFileInfo, session, vaultHolding(session))).toBeNull();
  });
});

describe("editorTextsOf", () => {
  it("reads every editor that shows the note, and none that shows another", () => {
    const editors = [editorShowing(session, "? Who\n"), editorShowing(other, "Mira's notes\n"), editorShowing(session, "? Who sent Mira\n")];
    expect(editorTextsOf(editors, session, vaultHolding(session, other))).toEqual(["? Who\n", "? Who sent Mira\n"]);
  });

  it("reads nothing when no editor is open", () => {
    expect(editorTextsOf([], session, vaultHolding(session))).toEqual([]);
  });
});
