import { describe, expect, it, vi } from "vitest";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { KeptDrafts } from "../../../src/session-notes/kept/kept-drafts";
import { DELETED, MISSING, MOVED } from "../../../src/session-notes/kept/kinds/kept-kinds";

const THREE = "Pale Moon/Sessions/Session 3.md";
const FOUR = "Pale Moon/Sessions/Session 4.md";
const AT = 1_000;

function keptWith(kept: Record<string, string>, now = () => AT) {
  const drafts = new Drafts(kept, () => {});
  return { drafts, keptDrafts: new KeptDrafts(drafts, now) };
}

describe("KeptDrafts", () => {
  it("keeps a deleted session's box under a key a new note at that path can't reach", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteDeleted(THREE);
    expect(drafts.textOf(THREE)).toBe("");
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(keptDrafts.kept()).toEqual([{ key: `deleted:${AT}:${THREE}`, kind: DELETED, path: THREE, keptAt: AT, text: "? Who" }]);
  });

  it("keeps the boxes of every session in a deleted folder", () => {
    const { keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it", "Pale Moon/Sessions old/Session 1.md": "Rain" });
    keptDrafts.noteDeleted("Pale Moon/Sessions");
    expect(keptDrafts.kept().map((draft) => draft.path)).toEqual([THREE, FOUR]);
  });

  it("keeps a second deletion of the same path apart from the first, oldest first", () => {
    const now = vi.fn(() => AT);
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who" }, now);
    keptDrafts.noteDeleted(THREE);
    drafts.keep(THREE, "! Find it");
    keptDrafts.noteDeleted(THREE);
    expect(keptDrafts.kept().map((draft) => [draft.keptAt, draft.text])).toEqual([
      [AT, "? Who"],
      [AT + 1, "! Find it"],
    ]);
  });

  it("copies kept lines after what the box already holds, and stops keeping them", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteDeleted(THREE);
    const [kept] = keptDrafts.kept();
    keptDrafts.copyInto(kept!.key, FOUR);
    expect(drafts.textOf(FOUR)).toBe("! Find it\n? Who");
    expect(keptDrafts.kept()).toEqual([]);
  });

  it("copies kept lines into an empty box as they are", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who" });
    keptDrafts.noteDeleted(THREE);
    keptDrafts.copyInto(keptDrafts.kept()[0]!.key, FOUR);
    expect(drafts.textOf(FOUR)).toBe("? Who");
  });

  it("doesn't copy while the target box is saving, so nothing is written twice or lost", async () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteDeleted(THREE);
    const key = keptDrafts.kept()[0]!.key;
    let finish = (_left: string) => {};
    const saving = drafts.save(FOUR, () => new Promise<string>((resolve) => (finish = resolve)));
    expect(keptDrafts.canCopy(key, FOUR)).toBe(false);
    keptDrafts.copyInto(key, FOUR);
    finish("");
    await saving;
    expect(drafts.textOf(FOUR)).toBe("");
    expect(drafts.textOf(key)).toBe("? Who");
    expect(keptDrafts.canCopy(key, FOUR)).toBe(true);
  });

  it("discards kept lines, and touches only keys it kept", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteDeleted(THREE);
    keptDrafts.discard(FOUR);
    keptDrafts.copyInto(FOUR, THREE);
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(drafts.textOf(THREE)).toBe("");
    keptDrafts.discard(keptDrafts.kept()[0]!.key);
    expect(drafts.all()).toEqual({ [FOUR]: "! Find it" });
  });

  it("leaves out keys it can't read", () => {
    const { keptDrafts } = keptWith({ "deleted:soon:Pale Moon/x.md": "a", "deleted::x.md": "b", "deleted:12": "c", [THREE]: "d" });
    expect(keptDrafts.kept()).toEqual([]);
  });

  it("keeps lines an earlier version left in the settings file apart, to copy or discard, not in the session's box", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? New" });
    keptDrafts.keepMoved({ [THREE]: "? Old", [FOUR]: "! Find it" });
    expect(drafts.textOf(THREE)).toBe("? New");
    expect(drafts.textOf(FOUR)).toBe("");
    expect(keptDrafts.kept()).toEqual([
      { key: `moved:${AT}:${THREE}`, kind: MOVED, path: THREE, keptAt: AT, text: "? Old" },
      { key: `moved:${AT}:${FOUR}`, kind: MOVED, path: FOUR, keptAt: AT, text: "! Find it" },
    ]);
  });

  it("sets aside lines of sessions whose note is gone, leaving kept lines and present notes alone", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteDeleted(FOUR);
    const exists = vi.fn((path: string) => path !== THREE);
    keptDrafts.notesGone(exists);
    expect(exists).toHaveBeenCalledExactlyOnceWith(THREE);
    expect(drafts.textOf(THREE)).toBe("");
    expect(keptDrafts.kept().map((draft) => [draft.kind, draft.path, draft.text])).toEqual([
      [DELETED, FOUR, "! Find it"],
      [MISSING, THREE, "? Who"],
    ]);
  });

  it("keeps both texts when a session is renamed onto a path that still holds lines", () => {
    const { drafts, keptDrafts } = keptWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    keptDrafts.noteRenamed(THREE, FOUR);
    expect(drafts.textOf(THREE)).toBe("");
    expect(drafts.textOf(FOUR)).toBe("? Who");
    expect(keptDrafts.kept()).toEqual([{ key: `missing:${AT}:${FOUR}`, kind: MISSING, path: FOUR, keptAt: AT, text: "! Find it" }]);
  });
});
