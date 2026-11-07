import { describe, expect, it } from "vitest";
import type { Editor, MarkdownFileInfo, TFile } from "obsidian";
import { editorTextOf } from "../../src/campaign/editor-text";

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
    expect(editorTextOf(editorShowing(session, "? Who"), session, vaultHolding(session))).toBe("? Who");
  });

  it("reads nothing once the editor has moved on to another note", () => {
    expect(editorTextOf(editorShowing(other, "Mira's notes"), session, vaultHolding(session, other))).toBeNull();
  });

  it("reads nothing once the note was deleted", () => {
    expect(editorTextOf(editorShowing(session, "? Who"), session, vaultHolding())).toBeNull();
  });

  it("reads nothing when there is no editor", () => {
    expect(editorTextOf({ file: session } as MarkdownFileInfo, session, vaultHolding(session))).toBeNull();
  });
});
