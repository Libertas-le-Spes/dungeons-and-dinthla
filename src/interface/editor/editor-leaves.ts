import type { TFile } from "obsidian";

export type KeptNote = Pick<TFile, "path">;

export class EditorLeaves {
  private readonly notes = new WeakMap<object, KeptNote>();

  keep(leaf: object, note: KeptNote): void {
    this.notes.set(leaf, note);
  }

  keeps(leaf: object, path: string): boolean {
    const note = this.notes.get(leaf);
    if (note === undefined) return false;
    return note.path === path;
  }
}

const LEAVES_OF_EACH_APP = new WeakMap<object, EditorLeaves>();

export function editorLeavesOf(app: object): EditorLeaves {
  const known = LEAVES_OF_EACH_APP.get(app);
  if (known !== undefined) return known;
  const leaves = new EditorLeaves();
  LEAVES_OF_EACH_APP.set(app, leaves);
  return leaves;
}
