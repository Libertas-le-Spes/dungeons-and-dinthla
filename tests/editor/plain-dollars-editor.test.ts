import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { editorInfoField, type MarkdownFileInfo, type TFile } from "obsidian";
import { plainDollarsClassOf } from "../../src/editor/plain-dollars-editor";

const SESSION = "D&D/Pale Moon/Sessions/Session 1.md";

function isPaleMoonNote(path: string): boolean {
  return path.startsWith("D&D/Pale Moon/");
}

function editorShowing(file: TFile | null): EditorState {
  const info = { file } as MarkdownFileInfo;
  function infoOf(): MarkdownFileInfo {
    return info;
  }
  return EditorState.create({ extensions: [editorInfoField.init(infoOf)] });
}

function fileAt(path: string): TFile {
  return { path } as TFile;
}

describe("plainDollarsClassOf", () => {
  it("marks an editor on a note of a campaign, so its dollar lines show as plain text", () => {
    expect(plainDollarsClassOf(editorShowing(fileAt(SESSION)), isPaleMoonNote)).toEqual({ class: "dd-plain-dollars" });
  });

  it("leaves an editor on a note outside every campaign as Obsidian shows it", () => {
    expect(plainDollarsClassOf(editorShowing(fileAt("Maths/Proofs.md")), isPaleMoonNote)).toBeNull();
  });

  it("leaves an editor on no note, or one Obsidian doesn't say the note of, alone", () => {
    expect(plainDollarsClassOf(editorShowing(null), isPaleMoonNote)).toBeNull();
    expect(plainDollarsClassOf(EditorState.create({}), isPaleMoonNote)).toBeNull();
  });
});
