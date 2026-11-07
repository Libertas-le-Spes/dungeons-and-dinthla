import { describe, expect, it } from "vitest";
import { findSubject } from "../../src/campaign/subject";

function same(title: string): string {
  return title;
}

describe("findSubject", () => {
  it("finds the line whose text comes right before the colon", () => {
    expect(findSubject("Who sent the letter: Lady Vess", ["Who sent the letter"], same)).toEqual({
      subject: "Who sent the letter",
      rest: "Lady Vess",
    });
  });

  it("prefers the longest text that matches", () => {
    expect(findSubject("Who sent the letter: Lady Vess", ["Who", "Who sent the letter"], same)?.subject).toBe(
      "Who sent the letter",
    );
  });

  it("never matches a shorter text that isn't followed by the colon", () => {
    expect(findSubject("Who sent the letter: Lady Vess", ["Who"], same)).toBeNull();
  });

  it("lets a colon inside the earlier text do no harm", () => {
    expect(findSubject("Ring: who made it: the elves", ["Ring: who made it"], same)).toEqual({
      subject: "Ring: who made it",
      rest: "the elves",
    });
  });

  it("allows space before the colon", () => {
    expect(findSubject("Who sent it : Mira", ["Who sent it"], same)?.rest).toBe("Mira");
  });

  it("finds nothing when no text matches", () => {
    expect(findSubject("Who is Mira: a rogue", ["Who sent the letter"], same)).toBeNull();
  });

  it("never matches an empty text", () => {
    expect(findSubject(": a rogue", [""], same)).toBeNull();
  });
});
