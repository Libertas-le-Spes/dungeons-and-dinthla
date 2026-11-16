import { describe, expect, it } from "vitest";
import { HeldTexts } from "../../../src/kind-notes/watching/held-texts";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";
const OTHER = "D&D/Pale Moon/Sessions/Session 3.md";
const TEXT = "? Who sent Mira\n";

describe("HeldTexts", () => {
  it("holds one text for a note", () => {
    const held = new HeldTexts();
    held.hold(SESSION, TEXT);
    expect(held.holds(SESSION, TEXT)).toBe(true);
  });

  it("replaces the text held for a note", () => {
    const held = new HeldTexts();
    held.hold(SESSION, "? Who\n");
    held.hold(SESSION, TEXT);
    expect(held.holds(SESSION, "? Who\n")).toBe(false);
    expect(held.holds(SESSION, TEXT)).toBe(true);
  });

  it("takes the text held, once", () => {
    const held = new HeldTexts();
    held.hold(SESSION, TEXT);
    expect(held.takeIfHeld(SESSION, TEXT)).toBe(true);
    expect(held.takeIfHeld(SESSION, TEXT)).toBe(false);
  });

  it("drops the text held when another text is taken", () => {
    const held = new HeldTexts();
    held.hold(SESSION, TEXT);
    expect(held.takeIfHeld(SESSION, "? Who sent Baka\n")).toBe(false);
    expect(held.holds(SESSION, TEXT)).toBe(false);
  });

  it("forgets a note's text when told to", () => {
    const held = new HeldTexts();
    held.hold(SESSION, TEXT);
    held.forget(SESSION);
    expect(held.holds(SESSION, TEXT)).toBe(false);
  });

  it("keeps the texts of different notes apart", () => {
    const held = new HeldTexts();
    held.hold(SESSION, TEXT);
    held.hold(OTHER, "! Find the caravan\n");
    held.forget(OTHER);
    expect(held.holds(SESSION, TEXT)).toBe(true);
  });
});
