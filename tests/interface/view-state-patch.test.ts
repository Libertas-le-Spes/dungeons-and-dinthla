import { describe, expect, it, vi } from "vitest";
import type { ViewState, WorkspaceLeaf } from "obsidian";
import { patchSetViewState, type ViewStateSetter } from "../../src/interface/view-state-patch";

const NOTE: ViewState = { type: "markdown", state: { file: "Pale Moon/Pale Moon.md" } };
const TAKEN: ViewState = { type: "dungeons-and-dinthla-campaign", state: { page: "home", path: "Pale Moon/Pale Moon.md" } };

class Leaf {
  readonly calls: { leaf: Leaf; viewState: ViewState; eState: unknown }[] = [];

  async setViewState(viewState: ViewState, eState?: unknown): Promise<void> {
    this.calls.push({ leaf: this, viewState, eState });
  }
}

function patchedLeaf(change: (viewState: ViewState) => ViewState) {
  const prototype = Leaf.prototype as unknown as ViewStateSetter;
  const original = prototype.setViewState;
  const undo = patchSetViewState(prototype, change);
  const restore = () => {
    prototype.setViewState = original;
  };
  return { leaf: new Leaf(), prototype, original, undo, restore };
}

describe("patchSetViewState", () => {
  it("passes the changed state to Obsidian's own method once, on the same leaf, with the eState", async () => {
    const change = vi.fn(() => TAKEN);
    const { leaf, restore } = patchedLeaf(change);
    await leaf.setViewState(NOTE, { line: 4 });
    restore();
    expect(change).toHaveBeenCalledExactlyOnceWith(NOTE);
    expect(leaf.calls).toEqual([{ leaf, viewState: TAKEN, eState: { line: 4 } }]);
  });

  it("passes the state through unchanged when deciding fails, so the file still opens", async () => {
    const { leaf, restore } = patchedLeaf(() => {
      throw new Error("the vault isn't ready");
    });
    await leaf.setViewState(NOTE);
    restore();
    expect(leaf.calls.map((call) => call.viewState)).toEqual([NOTE]);
  });

  it("puts Obsidian's own method back when it is undone", () => {
    const { prototype, original, undo } = patchedLeaf(() => TAKEN);
    undo();
    expect(prototype.setViewState).toBe(original);
  });

  it("leaves a later plugin's wrapper in place when undone, and stops changing states under it", async () => {
    const change = vi.fn(() => TAKEN);
    const { leaf, prototype, undo, restore } = patchedLeaf(change);
    const ours = prototype.setViewState;
    const theirs = function (this: WorkspaceLeaf, viewState: ViewState, eState?: unknown) {
      return ours.call(this, viewState, eState);
    };
    prototype.setViewState = theirs;
    undo();
    await leaf.setViewState(NOTE);
    expect(prototype.setViewState).toBe(theirs);
    restore();
    expect(change).not.toHaveBeenCalled();
    expect(leaf.calls.map((call) => call.viewState)).toEqual([NOTE]);
  });
});
