import { describe, expect, it, vi } from "vitest";
import { ShownAsk } from "../../../src/kind-notes/watching/shown-ask";

const QUESTIONS = "D&D/Pale Moon/Questions/Session 2.md";
const QUESTS = "D&D/Pale Moon/Quests/Session 2.md";

describe("ShownAsk", () => {
  it("dismisses the question once every note it asked about is put right", () => {
    const dismiss = vi.fn();
    const shown = new ShownAsk([QUESTIONS, QUESTS], dismiss);
    shown.putRight(QUESTIONS);
    expect(dismiss).not.toHaveBeenCalled();
    shown.putRight(QUESTS);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("dismisses the question only once", () => {
    const dismiss = vi.fn();
    const shown = new ShownAsk([QUESTIONS], dismiss);
    shown.putRight(QUESTIONS);
    shown.putRight(QUESTIONS);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("isn't dismissed by a note it didn't ask about", () => {
    const dismiss = vi.fn();
    const shown = new ShownAsk([QUESTIONS], dismiss);
    shown.putRight(QUESTS);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
