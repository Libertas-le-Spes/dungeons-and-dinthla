import { describe, expect, it, vi } from "vitest";
import type { Workspace } from "obsidian";
import { closeRetiredViews } from "../../../src/interface/takeover/retired-views";

describe("closeRetiredViews", () => {
  it("closes the tabs left by the old Questions, Quests, Funds, dashboard and character sheet views", () => {
    const detachLeavesOfType = vi.fn();
    closeRetiredViews({ detachLeavesOfType } as unknown as Workspace);
    expect(detachLeavesOfType.mock.calls).toEqual([
      ["dungeons-and-dinthla-questions"],
      ["dungeons-and-dinthla-quests"],
      ["dungeons-and-dinthla-funds"],
      ["dungeons-and-dinthla-dashboard"],
      ["dungeons-and-dinthla-character-sheet"],
    ]);
  });
});
