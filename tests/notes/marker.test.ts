import { describe, expect, it } from "vitest";
import { readMarker } from "../../src/notes/marker";

describe("readMarker", () => {
  it("reads a question, a quest and a ledger line", () => {
    expect(readMarker("? Who sent the letter")).toEqual({ marker: "question", body: "Who sent the letter" });
    expect(readMarker("! Find the caravan")).toEqual({ marker: "quest", body: "Find the caravan" });
    expect(readMarker("$ 35 gp from the bandits")).toEqual({ marker: "ledger", body: "35 gp from the bandits" });
  });

  it("allows leading space and no space after the marker", () => {
    expect(readMarker("  ?Who is Mira")).toEqual({ marker: "question", body: "Who is Mira" });
  });

  it("leaves a plain line unmarked", () => {
    expect(readMarker("We reached the Old Mill.")).toEqual({ marker: null, body: "We reached the Old Mill." });
  });

  it("leaves a doubled marker for looking up an earlier note unmarked", () => {
    expect(readMarker("?? letter").marker).toBeNull();
    expect(readMarker("!! caravan").marker).toBeNull();
    expect(readMarker("$$ potion").marker).toBeNull();
  });
});
