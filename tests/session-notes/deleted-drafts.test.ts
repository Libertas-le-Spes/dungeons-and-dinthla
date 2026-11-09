import { describe, expect, it, vi } from "vitest";
import { DeletedDrafts } from "../../src/session-notes/deleted-drafts";
import { Drafts } from "../../src/session-notes/drafts";

const THREE = "Pale Moon/Sessions/Session 3.md";
const FOUR = "Pale Moon/Sessions/Session 4.md";
const AT = 1_000;

function deletedWith(kept: Record<string, string>, now = () => AT) {
  const drafts = new Drafts(kept, () => {});
  return { drafts, deleted: new DeletedDrafts(drafts, now) };
}

describe("DeletedDrafts", () => {
  it("keeps a deleted session's box under a key a new note at that path can't reach", () => {
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    deleted.noteDeleted(THREE);
    expect(drafts.textOf(THREE)).toBe("");
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(deleted.kept()).toEqual([{ key: `deleted:${AT}:${THREE}`, path: THREE, deletedAt: AT, text: "? Who" }]);
  });

  it("keeps the boxes of every session in a deleted folder", () => {
    const { deleted } = deletedWith({ [THREE]: "? Who", [FOUR]: "! Find it", "Pale Moon/Sessions old/Session 1.md": "Rain" });
    deleted.noteDeleted("Pale Moon/Sessions");
    expect(deleted.kept().map((draft) => draft.path)).toEqual([THREE, FOUR]);
  });

  it("keeps a second deletion of the same path apart from the first, oldest first", () => {
    const now = vi.fn(() => AT);
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who" }, now);
    deleted.noteDeleted(THREE);
    drafts.keep(THREE, "! Find it");
    deleted.noteDeleted(THREE);
    expect(deleted.kept().map((draft) => [draft.deletedAt, draft.text])).toEqual([
      [AT, "? Who"],
      [AT + 1, "! Find it"],
    ]);
  });

  it("copies kept lines after what the box already holds, and stops keeping them", () => {
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    deleted.noteDeleted(THREE);
    const [kept] = deleted.kept();
    deleted.copyInto(kept!.key, FOUR);
    expect(drafts.textOf(FOUR)).toBe("! Find it\n? Who");
    expect(deleted.kept()).toEqual([]);
  });

  it("copies kept lines into an empty box as they are", () => {
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who" });
    deleted.noteDeleted(THREE);
    deleted.copyInto(deleted.kept()[0]!.key, FOUR);
    expect(drafts.textOf(FOUR)).toBe("? Who");
  });

  it("doesn't copy while the target box is saving, so nothing is written twice or lost", async () => {
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    deleted.noteDeleted(THREE);
    const key = deleted.kept()[0]!.key;
    let finish = (_left: string) => {};
    const saving = drafts.save(FOUR, () => new Promise<string>((resolve) => (finish = resolve)));
    expect(deleted.canCopy(key, FOUR)).toBe(false);
    deleted.copyInto(key, FOUR);
    finish("");
    await saving;
    expect(drafts.textOf(FOUR)).toBe("");
    expect(drafts.textOf(key)).toBe("? Who");
    expect(deleted.canCopy(key, FOUR)).toBe(true);
  });

  it("discards kept lines, and touches only keys it kept", () => {
    const { drafts, deleted } = deletedWith({ [THREE]: "? Who", [FOUR]: "! Find it" });
    deleted.noteDeleted(THREE);
    deleted.discard(FOUR);
    deleted.copyInto(FOUR, THREE);
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(drafts.textOf(THREE)).toBe("");
    deleted.discard(deleted.kept()[0]!.key);
    expect(drafts.all()).toEqual({ [FOUR]: "! Find it" });
  });

  it("leaves out keys it can't read", () => {
    const { deleted } = deletedWith({ "deleted:soon:Pale Moon/x.md": "a", "deleted::x.md": "b", "deleted:12": "c", [THREE]: "d" });
    expect(deleted.kept()).toEqual([]);
  });
});
