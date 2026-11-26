import { describe, expect, it } from "vitest";
import { DraftBox } from "../../../src/session-notes/writing/draft-box";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import { Div } from "../../../src/views/elements/kinds/containers";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function nothing(): void {}

const NO_WATCHER = { keyDown: nothing, typed: nothing, caretMoved: nothing, left: nothing };

function drawnBox(): HTMLElement {
  const parent = obsidianDocument().body.createDiv();
  for (const tree of new DraftBox("", nothing).trees(NO_WATCHER, new Div({}))) mountTree(tree, parent);
  return parent;
}

describe("DraftBox", () => {
  it("puts the note box in a frame of its own, inside its label, for the campaign picture to show through", () => {
    const frame = drawnBox().querySelector("textarea")!.parentElement!;
    expect(frame.className).toBe("dd-box-frame");
    expect(frame.parentElement!.className).toBe("dd-box-label");
  });
});
