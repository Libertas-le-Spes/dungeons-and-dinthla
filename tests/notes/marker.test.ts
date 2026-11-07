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

  it("trims extra spaces after the marker", () => {
    expect(readMarker("?   Who is Mira")).toEqual({ marker: "question", body: "Who is Mira" });
  });

  it("reads a line that ends in a Windows line break", () => {
    expect(readMarker("$ 5 gp\r")).toEqual({ marker: "ledger", body: "5 gp" });
  });

  it("reads a marker after a list bullet", () => {
    expect(readMarker("- ? Who sent the letter")).toEqual({ marker: "question", body: "Who sent the letter" });
    expect(readMarker("* ! Find the caravan")).toEqual({ marker: "quest", body: "Find the caravan" });
    expect(readMarker("+ $ 5 gp")).toEqual({ marker: "ledger", body: "5 gp" });
  });

  it("reads a marker after an indented bullet", () => {
    expect(readMarker("    - ? Who is Mira")).toEqual({ marker: "question", body: "Who is Mira" });
  });

  it("reads a marker after a bullet followed by a tab", () => {
    expect(readMarker("-\t? Who sent the letter")).toEqual({ marker: "question", body: "Who sent the letter" });
  });

  it("skips only one bullet", () => {
    expect(readMarker("- - ? Who is Mira")).toEqual({ marker: null, body: "- - ? Who is Mira" });
  });

  it("leaves a numbered list line unmarked", () => {
    expect(readMarker("1. ? Who is Mira")).toEqual({ marker: null, body: "1. ? Who is Mira" });
  });

  it("leaves a bullet of plain notes unmarked and whole", () => {
    expect(readMarker("- We reached the Old Mill.")).toEqual({ marker: null, body: "- We reached the Old Mill." });
  });

  it("leaves a doubled marker after a bullet unmarked", () => {
    expect(readMarker("- ?? letter").marker).toBeNull();
  });

  it("needs a space after the bullet", () => {
    expect(readMarker("-? Who sent the letter").marker).toBeNull();
  });

  it("leaves a plain line unmarked", () => {
    expect(readMarker("We reached the Old Mill.")).toEqual({ marker: null, body: "We reached the Old Mill." });
  });

  it("leaves an empty line unmarked", () => {
    expect(readMarker("")).toEqual({ marker: null, body: "" });
  });

  it("leaves a doubled marker for looking up an earlier note unmarked", () => {
    expect(readMarker("?? letter").marker).toBeNull();
    expect(readMarker("!! caravan").marker).toBeNull();
    expect(readMarker("$$ potion").marker).toBeNull();
  });

  it("leaves a follow-up line to the follow-up reader", () => {
    for (const line of ["?+ Who: a clue", "?= Who: Mira", "!+ Find it: tracks", "!= Find it: found", "!x Find it: burned"]) {
      expect(readMarker(line).marker).toBeNull();
    }
  });

  it("still reads a quest whose title starts with an x", () => {
    expect(readMarker("!xylophone for the bard")).toEqual({ marker: "quest", body: "xylophone for the bard" });
  });
});
