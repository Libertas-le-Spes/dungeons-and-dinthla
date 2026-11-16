import { describe, expect, it } from "vitest";
import { MarkdownView, WorkspaceLeaf, type TFile } from "obsidian";
import { NoteViews } from "../../../src/campaign/reading/note-views";

const SESSION = "Pale Moon/Sessions/Session 3.md";
const MIRA = "Pale Moon/Characters/Mira.md";

const session = { path: SESSION } as TFile;
const mira = { path: MIRA } as TFile;

class ShownText {
  constructor(private readonly text: string) {}

  getValue(): string {
    return this.text;
  }
}

function noteViewShowing(file: TFile | null, text: string): MarkdownView {
  return Object.assign(Object.create(MarkdownView.prototype), { file, editor: new ShownText(text) });
}

function leafHolding(view: unknown): WorkspaceLeaf {
  return Object.assign(Object.create(WorkspaceLeaf.prototype), { view });
}

class FakeWorkspace {
  constructor(private readonly leaves: WorkspaceLeaf[]) {}

  iterateAllLeaves(visit: (leaf: WorkspaceLeaf) => unknown): void {
    for (const leaf of this.leaves) visit(leaf);
  }
}

class FakeFiles {
  constructor(private readonly files: TFile[]) {}

  getFileByPath(path: string): TFile | null {
    for (const file of this.files) {
      if (file.path === path) return file;
    }
    return null;
  }
}

const EMPTY_TAB = { file: session, editor: new ShownText("? Not a note view\n") };

function noteViewsOver(leaves: WorkspaceLeaf[], files: TFile[]): NoteViews {
  return new NoteViews(new FakeWorkspace(leaves), new FakeFiles(files));
}

describe("NoteViews", () => {
  it("lists the note views of every tab, and no other kind of tab", () => {
    const first = noteViewShowing(session, "? Who\n");
    const second = noteViewShowing(mira, "Mira's notes\n");
    const views = noteViewsOver([leafHolding(first), leafHolding(EMPTY_TAB), leafHolding(second)], [session, mira]);
    expect(views.all()).toEqual([first, second]);
  });

  it("reads what every note view showing the note holds, and nothing from views of other notes or other kinds of tab", () => {
    const leaves = [leafHolding(noteViewShowing(session, "? Who\n")), leafHolding(noteViewShowing(mira, "Mira's notes\n")), leafHolding(EMPTY_TAB), leafHolding(noteViewShowing(session, "? Who sent Mira\n"))];
    expect(noteViewsOver(leaves, [session, mira]).textsAt(SESSION)).toEqual(["? Who\n", "? Who sent Mira\n"]);
  });

  it("reads nothing for a note the vault doesn't hold, even from a view that shows no note", () => {
    const leaves = [leafHolding(noteViewShowing(null, "")), leafHolding(noteViewShowing(session, "? Who\n"))];
    expect(noteViewsOver(leaves, []).textsAt(SESSION)).toEqual([]);
  });
});
