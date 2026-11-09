import { describe, expect, it, vi } from "vitest";
import type { LookupMatch } from "../../src/lookups/lookup";
import { openMatch } from "../../src/lookups/open-match";

const SOURCE = { path: "Pale Moon/Sessions/Session 2.md", line: 4 };

function openers() {
  return { question: vi.fn(), quest: vi.fn(), item: vi.fn() };
}

function matchOf(kind: LookupMatch["kind"]): LookupMatch {
  return { kind, text: "Silvered lantern", holder: "Mira", source: { path: "Pale Moon/Sessions/Session 1.md", line: 0 } };
}

describe("openMatch", () => {
  it("opens a question's dialog at the source given", () => {
    const opened = openers();
    const onClosed = vi.fn();
    openMatch(opened, matchOf("question"), SOURCE, onClosed);
    expect(opened.question).toHaveBeenCalledExactlyOnceWith(SOURCE, onClosed);
    expect(opened.quest).not.toHaveBeenCalled();
    expect(opened.item).not.toHaveBeenCalled();
  });

  it("opens a quest's dialog at the source given", () => {
    const opened = openers();
    const onClosed = vi.fn();
    openMatch(opened, matchOf("quest"), SOURCE, onClosed);
    expect(opened.quest).toHaveBeenCalledExactlyOnceWith(SOURCE, onClosed);
    expect(opened.question).not.toHaveBeenCalled();
  });

  it("opens an item's dialog by its name", () => {
    const opened = openers();
    const onClosed = vi.fn();
    openMatch(opened, matchOf("item"), SOURCE, onClosed);
    expect(opened.item).toHaveBeenCalledExactlyOnceWith("Silvered lantern", SOURCE, onClosed);
    expect(opened.question).not.toHaveBeenCalled();
  });
});
