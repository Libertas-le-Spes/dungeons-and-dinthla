import { describe, expect, it } from "vitest";
import { TRACKED_KINDS } from "../../src/kinds/tracked-kinds";

describe("the tracked kinds' kind note folders", () => {
  it("keeps questions' lines in Questions", () => {
    expect(TRACKED_KINDS.question.kindNoteFolder).toBe("Questions");
  });

  it("keeps quests' lines in Quests", () => {
    expect(TRACKED_KINDS.quest.kindNoteFolder).toBe("Quests");
  });

  it("keeps coin lines and item lines together in Funds", () => {
    expect(TRACKED_KINDS.coin.kindNoteFolder).toBe("Funds");
    expect(TRACKED_KINDS.item.kindNoteFolder).toBe("Funds");
  });

  it("leaves an item's own note in Items", () => {
    expect(TRACKED_KINDS.item.folder).toBe("Items");
  });
});
