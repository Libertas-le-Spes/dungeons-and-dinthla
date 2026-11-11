import { describe, expect, it, vi } from "vitest";
import type { ViewState, WorkspaceLeaf } from "obsidian";
import { patchSetViewState, type ViewStateSetter, type ViewStateSettled } from "../../../src/interface/takeover/view-state-patch";

const NOTE: ViewState = { type: "markdown", state: { file: "Pale Moon/Pale Moon.md" } };
const TAKEN: ViewState = { type: "dungeons-and-dinthla-campaign", state: { page: "home", path: "Pale Moon/Pale Moon.md" } };

class Leaf {
  readonly calls: { leaf: Leaf; viewState: ViewState; eState: unknown }[] = [];
  readonly view = { getViewType: () => "empty" };
  fails = false;

  async setViewState(viewState: ViewState, eState?: unknown): Promise<void> {
    this.calls.push({ leaf: this, viewState, eState });
    if (this.fails) throw new Error("the tab is busy");
  }
}

function patchedLeaf(change: (viewState: ViewState) => ViewState, settled: ViewStateSettled = () => {}) {
  const prototype = Leaf.prototype as unknown as ViewStateSetter;
  const original = prototype.setViewState;
  const undo = patchSetViewState(prototype, { change, settled });
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

  it("tells what was set once Obsidian's own method has finished, with the tab's kind before it", async () => {
    const settled = vi.fn();
    const { leaf, restore } = patchedLeaf(() => TAKEN, settled);
    const setting = leaf.setViewState(NOTE);
    expect(settled).not.toHaveBeenCalled();
    await setting;
    await Promise.resolve();
    restore();
    expect(settled).toHaveBeenCalledExactlyOnceWith(leaf, { typeBefore: "empty", incoming: NOTE, sent: TAKEN });
  });

  it("tells nothing when Obsidian's own method fails, and hands its failure back", async () => {
    const settled = vi.fn();
    const { leaf, restore } = patchedLeaf(() => TAKEN, settled);
    leaf.fails = true;
    await expect(leaf.setViewState(NOTE)).rejects.toThrow("the tab is busy");
    await Promise.resolve();
    restore();
    expect(settled).not.toHaveBeenCalled();
  });

  it("still opens the file when telling what was set fails", async () => {
    const { leaf, restore } = patchedLeaf(() => TAKEN, () => {
      throw new Error("no tabs to look at");
    });
    await expect(leaf.setViewState(NOTE)).resolves.toBeUndefined();
    await Promise.resolve();
    restore();
    expect(leaf.calls.map((call) => call.viewState)).toEqual([TAKEN]);
  });

  it("tells nothing once it is undone", async () => {
    const settled = vi.fn();
    const { leaf, undo } = patchedLeaf(() => TAKEN, settled);
    const ours = Leaf.prototype.setViewState;
    undo();
    await ours.call(leaf, NOTE);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
  });
});
