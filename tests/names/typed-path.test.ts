import { describe, expect, it } from "vitest";
import { typedPathOf } from "../../src/names/typed-path";

const NOTHING_TYPED = "Type a name first.";

describe("typedPathOf", () => {
  it("takes what was typed without the spaces around it", () => {
    expect(typedPathOf("  Silver Road  ", NOTHING_TYPED)).toBe("Silver Road");
  });

  it("writes it as Obsidian writes a path", () => {
    expect(typedPathOf("Games//D&D/", NOTHING_TYPED)).toBe("Games/D&D");
  });

  it("refuses nothing but spaces with the message it is given", () => {
    expect(() => typedPathOf("   ", NOTHING_TYPED)).toThrow(NOTHING_TYPED);
  });
});
