import { describe, expect, it } from "vitest";
import { lookupHeadingOf } from "../../src/lookups/lookup-heading";

describe("lookupHeadingOf", () => {
  it("asks which line to pick when something matches", () => {
    expect(lookupHeadingOf({ kind: "question", keywords: ["mill"] }, { matching: 2, open: 5 })).toBe("Pick the question to answer");
    expect(lookupHeadingOf({ kind: "quest", keywords: [] }, { matching: 1, open: 1 })).toBe("Pick the quest to update");
    expect(lookupHeadingOf({ kind: "item", keywords: ["rope"] }, { matching: 1, open: 3 })).toBe("Pick the item to update");
  });

  it("names the words typed when nothing open matches them", () => {
    expect(lookupHeadingOf({ kind: "question", keywords: ["old", "mill"] }, { matching: 0, open: 4 })).toBe("No open question matches “old mill”");
    expect(lookupHeadingOf({ kind: "quest", keywords: ["stag"] }, { matching: 0, open: 1 })).toBe("No active quest matches “stag”");
    expect(lookupHeadingOf({ kind: "item", keywords: ["lantern"] }, { matching: 0, open: 2 })).toBe("No held item matches “lantern”");
  });

  it("says there is nothing open at all", () => {
    expect(lookupHeadingOf({ kind: "question", keywords: ["mill"] }, { matching: 0, open: 0 })).toBe("No open questions");
    expect(lookupHeadingOf({ kind: "quest", keywords: [] }, { matching: 0, open: 0 })).toBe("No active quests");
    expect(lookupHeadingOf({ kind: "item", keywords: [] }, { matching: 0, open: 0 })).toBe("No held items");
  });
});
