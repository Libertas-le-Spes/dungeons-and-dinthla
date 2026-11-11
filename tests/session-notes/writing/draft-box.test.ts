import { describe, expect, it } from "vitest";
import { DraftBox } from "../../../src/session-notes/writing/draft-box";
import { obsidianDocument } from "../../views/obsidian-dom";

function nothing(): void {}

function box(): DraftBox {
  const parent = obsidianDocument().body.createDiv();
  return new DraftBox(parent, "", nothing);
}

describe("DraftBox", () => {
  it("puts the note box in a frame of its own, inside its label, for the campaign picture to show through", () => {
    const frame = box().textarea.parentElement!;
    expect(frame.className).toBe("dd-box-frame");
    expect(frame.parentElement!.className).toBe("dd-box-label");
  });
});
