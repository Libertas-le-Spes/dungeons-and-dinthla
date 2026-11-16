import { describe, expect, it, vi } from "vitest";
import { TypingPauses } from "../../../src/kind-notes/watching/typing-pauses";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";
const TEXT = "? Who sent Mira\n";

describe("TypingPauses", () => {
  it("tells each listener the note and the text shown at a pause", () => {
    const pauses = new TypingPauses();
    const first = vi.fn();
    const second = vi.fn();
    pauses.onPause(first);
    pauses.onPause(second);
    pauses.paused(SESSION, TEXT);
    expect(first).toHaveBeenCalledExactlyOnceWith(SESSION, TEXT);
    expect(second).toHaveBeenCalledExactlyOnceWith(SESSION, TEXT);
  });

  it("tells a listener nothing after it stops", () => {
    const pauses = new TypingPauses();
    const listener = vi.fn();
    const stop = pauses.onPause(listener);
    stop();
    pauses.paused(SESSION, TEXT);
    expect(listener).not.toHaveBeenCalled();
  });
});
